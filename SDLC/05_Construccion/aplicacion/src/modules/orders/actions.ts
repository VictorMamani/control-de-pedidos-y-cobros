"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { centsToDecimal, parseBobsToCents, parseQuantityToMilli } from "@/lib/money";
import { getWorkspaceContext, type WorkspaceContext } from "@/lib/workspace";

const orderIdSchema = z.string().uuid();
const fulfillmentSchema = z.enum(["preparing", "ready", "delivered"]);
const createOrderSchema = z.object({
  customerLabel: z.string().trim().max(80).optional(),
  description: z.string().trim().min(2).max(120),
  sku: z.string().trim().max(40).optional(),
  quantity: z.string().trim().max(12),
  unitPrice: z.string().trim().max(12),
});
const quotationMetadataSchema = z.object({
  customerName: z.string().trim().max(80).optional(),
  contactValue: z.string().trim().max(100).optional(),
  validUntil: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});
const quotationIdSchema = z.string().uuid();
const quotationStatusSchema = z.enum(["sent", "declined", "expired"]);
const paymentSchema = z.object({
  orderId: orderIdSchema,
  amount: z.string().trim().max(12),
  methodLabel: z.enum(["cash", "transfer_reported", "qr_reported", "other"]),
});

async function requireReadyWorkspace(destination: string) {
  const workspace: WorkspaceContext = await getWorkspaceContext();
  if (workspace.mode === "preview") redirect(`${destination}?error=setup`);
  if (workspace.mode === "unauthenticated") redirect("/login");
  if (workspace.mode === "onboarding") redirect("/");
  if (workspace.mode !== "ready") redirect(`${destination}?error=connection`);
  return workspace;
}

function invalidateOrderPaths(orderId?: string) {
  revalidatePath("/");
  revalidatePath("/orders");
  if (orderId) revalidatePath(`/orders/${orderId}`);
}

function centsToAmount(cents: number) {
  return centsToDecimal(cents);
}

export async function createOrder(formData: FormData) {
  const parsed = createOrderSchema.safeParse({
    customerLabel: formData.get("customerLabel") || undefined,
    description: formData.get("description"),
    sku: formData.get("sku") || undefined,
    quantity: formData.get("quantity"),
    unitPrice: formData.get("unitPrice"),
  });
  const destination = "/orders/new";
  if (!parsed.success) redirect(`${destination}?error=invalid`);

  const quantityMilli = parseQuantityToMilli(parsed.data.quantity);
  const unitPriceCents = parseBobsToCents(parsed.data.unitPrice);
  if (!quantityMilli || unitPriceCents === null || unitPriceCents > 1_000_000_000) {
    redirect(`${destination}?error=invalid`);
  }
  const workspace = await requireReadyWorkspace(destination);
  const { error } = await workspace.supabase.rpc("create_order_with_line", {
    p_business_id: workspace.business.id,
    p_customer_label: parsed.data.customerLabel || "",
    p_description: parsed.data.description,
    p_sku: parsed.data.sku || "",
    p_quantity: quantityMilli / 1000,
    p_unit_price: centsToAmount(unitPriceCents),
  });
  if (error) redirect(`${destination}?error=save`);

  invalidateOrderPaths();
  redirect("/orders?created=1");
}

export async function createQuotation(formData: FormData) {
  const metadata = quotationMetadataSchema.safeParse({
    customerName: formData.get("customerName") || undefined,
    contactValue: formData.get("contactValue") || undefined,
    validUntil: formData.get("validUntil") || undefined,
  });
  const destination = "/quotations/new";
  if (!metadata.success) redirect(`${destination}?error=invalid`);

  const descriptions = formData.getAll("description");
  const skus = formData.getAll("sku");
  const quantities = formData.getAll("quantity");
  const prices = formData.getAll("unitPrice");
  const columns = [descriptions, skus, quantities, prices];
  if (columns.some((column) => column.some((item) => typeof item !== "string"))
    || columns.some((column) => column.length !== descriptions.length)
    || descriptions.length > 20) redirect(`${destination}?error=invalid`);

  const lines = descriptions.map((item, index) => ({
    description: String(item).trim(),
    sku: String(skus[index]).trim(),
    quantity: String(quantities[index]).trim(),
    unitPrice: String(prices[index]).trim(),
  })).filter((line) => line.description || line.sku || line.quantity || line.unitPrice);

  if (lines.length === 0) redirect(`${destination}?error=lines`);
  const rpcLines: Array<{ description: string; sku: string | null; quantity: number; unit_price: number }> = [];
  for (const line of lines) {
    const quantityMilli = parseQuantityToMilli(line.quantity);
    const unitPriceCents = parseBobsToCents(line.unitPrice);
    if (line.description.length < 2 || line.description.length > 120 || line.sku.length > 40
      || !quantityMilli || unitPriceCents === null || unitPriceCents > 1_000_000_000) {
      redirect(`${destination}?error=invalid`);
    }
    rpcLines.push({
      description: line.description,
      sku: line.sku || null,
      quantity: quantityMilli / 1000,
      unit_price: centsToAmount(unitPriceCents),
    });
  }

  const workspace = await requireReadyWorkspace(destination);
  const { error } = await workspace.supabase.rpc("create_quotation_with_lines", {
    p_business_id: workspace.business.id,
    p_customer_name: metadata.data.customerName || "",
    p_contact_value: metadata.data.contactValue || "",
    p_valid_until: metadata.data.validUntil || null,
    p_lines: rpcLines,
  });
  if (error) redirect(`${destination}?error=save`);

  revalidatePath("/");
  revalidatePath("/quotations");
  redirect("/quotations?created=1");
}

export async function changeQuotationStatus(formData: FormData) {
  const id = quotationIdSchema.safeParse(formData.get("quotationId"));
  const status = quotationStatusSchema.safeParse(formData.get("nextStatus"));
  if (!id.success || !status.success) redirect("/quotations?error=invalid");
  const destination = `/quotations/${id.data}`;
  const workspace = await requireReadyWorkspace(destination);
  const { error } = await workspace.supabase.rpc("change_quotation_status", {
    p_business_id: workspace.business.id,
    p_quotation_id: id.data,
    p_next_status: status.data,
  });
  if (error) redirect(`${destination}?error=${error.code === "22023" ? "transition" : "save"}`);
  revalidatePath("/quotations");
  revalidatePath(destination);
  redirect(`${destination}?updated=1`);
}

export async function acceptQuotation(formData: FormData) {
  const id = quotationIdSchema.safeParse(formData.get("quotationId"));
  if (!id.success) redirect("/quotations?error=invalid");
  const destination = `/quotations/${id.data}`;
  const workspace = await requireReadyWorkspace(destination);
  const { data: orderId, error } = await workspace.supabase.rpc("create_order_from_quotation", {
    p_business_id: workspace.business.id,
    p_quotation_id: id.data,
  });
  if (error || !orderId) {
    const code = error?.message.includes("quotation_expired") ? "expired" : "transition";
    redirect(`${destination}?error=${code}`);
  }
  revalidatePath("/");
  revalidatePath("/orders");
  revalidatePath("/quotations");
  revalidatePath(destination);
  redirect(`/orders/${orderId}?converted=1`);
}

export async function changeFulfillment(formData: FormData) {
  const orderId = orderIdSchema.safeParse(formData.get("orderId"));
  const nextStatus = fulfillmentSchema.safeParse(formData.get("nextStatus"));
  if (!orderId.success || !nextStatus.success) redirect("/orders?error=invalid");

  const destination = `/orders/${orderId.data}`;
  const workspace = await requireReadyWorkspace(destination);
  const { error } = await workspace.supabase.rpc("change_order_fulfillment", {
    p_business_id: workspace.business.id,
    p_order_id: orderId.data,
    p_next_status: nextStatus.data,
  });
  if (error) redirect(`${destination}?error=${error.code === "22023" ? "transition" : "save"}`);
  invalidateOrderPaths(orderId.data);
  redirect(`${destination}?updated=1`);
}

export async function recordPayment(formData: FormData) {
  const parsed = paymentSchema.safeParse({
    orderId: formData.get("orderId"),
    amount: formData.get("amount"),
    methodLabel: formData.get("methodLabel"),
  });
  if (!parsed.success) redirect("/orders?error=invalid");
  const amountCents = parseBobsToCents(parsed.data.amount);
  if (amountCents === null || amountCents <= 0 || amountCents > 1_000_000_000) {
    redirect(`/orders/${parsed.data.orderId}?error=invalid`);
  }
  const destination = `/orders/${parsed.data.orderId}`;
  const workspace = await requireReadyWorkspace(destination);
  const { error } = await workspace.supabase.rpc("record_order_payment", {
    p_business_id: workspace.business.id,
    p_order_id: parsed.data.orderId,
    p_amount: centsToAmount(amountCents),
    p_method_label: parsed.data.methodLabel,
  });
  if (error) {
    const code = error.message.includes("payment_exceeds_balance") ? "balance" : "save";
    redirect(`${destination}?error=${code}`);
  }
  invalidateOrderPaths(parsed.data.orderId);
  redirect(`${destination}?payment=recorded`);
}

export async function reversePayment(formData: FormData) {
  const paymentId = z.string().uuid().safeParse(formData.get("paymentId"));
  const orderId = orderIdSchema.safeParse(formData.get("orderId"));
  const reason = z.string().trim().max(160).optional().safeParse(formData.get("reason") || undefined);
  if (!paymentId.success || !orderId.success || !reason.success) redirect("/orders?error=invalid");
  const destination = `/orders/${orderId.data}`;
  const workspace = await requireReadyWorkspace(destination);
  const { error } = await workspace.supabase.rpc("reverse_order_payment", {
    p_business_id: workspace.business.id,
    p_payment_id: paymentId.data,
    p_reason: reason.data || undefined,
  });
  if (error) redirect(`${destination}?error=${error.message.includes("payment_already_reversed") ? "reversed" : "save"}`);
  invalidateOrderPaths(orderId.data);
  redirect(`${destination}?reversed=1`);
}

export async function cancelOrder(formData: FormData) {
  const orderId = orderIdSchema.safeParse(formData.get("orderId"));
  const reason = z.string().trim().min(3).max(160).safeParse(formData.get("reason"));
  if (!orderId.success || !reason.success) redirect("/orders?error=invalid");
  const destination = `/orders/${orderId.data}`;
  const workspace = await requireReadyWorkspace(destination);
  if (workspace.business.role !== "owner" && workspace.business.role !== "manager") {
    redirect(`${destination}?error=permission`);
  }
  const { error } = await workspace.supabase.rpc("cancel_order", {
    p_business_id: workspace.business.id,
    p_order_id: orderId.data,
    p_reason: reason.data,
  });
  if (error) redirect(`${destination}?error=${error.message.includes("payments_must_be_reversed") ? "payments-open" : "save"}`);
  invalidateOrderPaths(orderId.data);
  redirect(`${destination}?cancelled=1`);
}
