import { randomBytes, randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

function readLocalEnv() {
  const env = {};
  for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    const match = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
    if (match) env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
  }
  return env;
}

const env = readLocalEnv();
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (!url || !key) throw new Error("Falta URL o publishable key local en .env.local");

const suffix = randomUUID();
const password = `${randomBytes(24).toString("hex")}aA1!`;
const clients = {};

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function expectSuccess(result, label) {
  if (result.error) throw new Error(`${label}: ${result.error.message}`);
  return result.data;
}

async function makeUser(label) {
  const client = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
  const email = `e2e-${label}-${suffix}@bytecx.example.test`;
  const signedUp = await client.auth.signUp({ email, password });
  expectSuccess(signedUp, `Registro de usuario ${label}`);
  const signedIn = await client.auth.signInWithPassword({ email, password });
  expectSuccess(signedIn, `Inicio de sesión de usuario ${label}`);
  return client;
}

async function rpc(client, name, args) {
  return expectSuccess(await client.rpc(name, args), `RPC ${name}`);
}

async function balance(client, businessId, orderId) {
  const [lineResult, paymentResult] = await Promise.all([
    client.from("order_lines").select("quantity, unit_price").eq("business_id", businessId).eq("order_id", orderId),
    client.from("payment_entries").select("amount, reverses_entry_id").eq("business_id", businessId).eq("order_id", orderId),
  ]);
  const lines = expectSuccess(lineResult, "Lectura de líneas");
  const payments = expectSuccess(paymentResult, "Lectura de cobros");
  const total = lines.reduce((sum, line) => sum + Math.round(Number(line.quantity) * Number(line.unit_price) * 100), 0);
  const paid = payments.reduce((sum, payment) => sum + (payment.reverses_entry_id ? -1 : 1) * Math.round(Number(payment.amount) * 100), 0);
  return total - paid;
}

try {
  clients.a = await makeUser("a");
  clients.b = await makeUser("b");
  const businessA = await rpc(clients.a, "create_business", { p_name: "Comercio E2E sintético A" });
  const businessB = await rpc(clients.b, "create_business", { p_name: "Comercio E2E sintético B" });

  const quotationId = await rpc(clients.a, "create_quotation_with_lines", {
    p_business_id: businessA,
    p_customer_name: "Comprador de prueba A",
    p_contact_value: "",
    p_valid_until: null,
    p_lines: [
      { description: "Teclado sintético E2E", sku: "E2E-KB", quantity: 1, unit_price: 500 },
      { description: "Memoria sintética E2E", sku: "E2E-RAM", quantity: 1, unit_price: 300 },
    ],
  });
  await rpc(clients.a, "change_quotation_status", { p_business_id: businessA, p_quotation_id: quotationId, p_next_status: "sent" });
  const orderId = await rpc(clients.a, "create_order_from_quotation", { p_business_id: businessA, p_quotation_id: quotationId });
  const repeatedOrderId = await rpc(clients.a, "create_order_from_quotation", { p_business_id: businessA, p_quotation_id: quotationId });
  assert(orderId === repeatedOrderId, "Aceptar dos veces no debe duplicar el pedido");

  const [snapshotResult, orderRead] = await Promise.all([
    clients.a.from("order_lines").select("description_snapshot, sku_snapshot, quantity, unit_price").eq("business_id", businessA).eq("order_id", orderId),
    clients.a.from("orders").select("id, quotation_id, commercial_status, fulfillment_status").eq("business_id", businessA).eq("id", orderId).single(),
  ]);
  const snapshots = expectSuccess(snapshotResult, "Lectura de snapshots");
  const order = expectSuccess(orderRead, "Lectura del pedido");
  assert(snapshots.length === 2 && order.quotation_id === quotationId, "La aceptación debe copiar dos líneas y enlazar la cotización");

  await rpc(clients.a, "change_order_fulfillment", { p_business_id: businessA, p_order_id: orderId, p_next_status: "preparing" });
  await rpc(clients.a, "record_order_payment", { p_business_id: businessA, p_order_id: orderId, p_amount: 500, p_method_label: "cash" });
  assert(await balance(clients.a, businessA, orderId) === 30000, "El saldo tras el anticipo debe ser BOB 300");
  await rpc(clients.a, "change_order_fulfillment", { p_business_id: businessA, p_order_id: orderId, p_next_status: "ready" });
  const secondPayment = await rpc(clients.a, "record_order_payment", { p_business_id: businessA, p_order_id: orderId, p_amount: 300, p_method_label: "transfer_reported" });
  assert(await balance(clients.a, businessA, orderId) === 0, "El saldo al cobrar todo debe ser cero");

  await rpc(clients.a, "reverse_order_payment", { p_business_id: businessA, p_payment_id: secondPayment, p_reason: "Corrección sintética" });
  const reversalRecord = expectSuccess(await clients.a.from("payment_entries").select("reversal_reason")
    .eq("business_id", businessA).eq("reverses_entry_id", secondPayment).single(), "Lectura de la reversión");
  assert(reversalRecord.reversal_reason === "Corrección sintética", "La razón breve debe quedar junto al registro de reversión");
  assert(await balance(clients.a, businessA, orderId) === 30000, "La reversión debe reabrir BOB 300 de saldo");
  const secondReversal = await clients.a.rpc("reverse_order_payment", { p_business_id: businessA, p_payment_id: secondPayment, p_reason: "Doble reversión de prueba" });
  assert(secondReversal.error?.message.includes("payment_already_reversed"), "La segunda reversión debe rechazarse");
  await rpc(clients.a, "record_order_payment", { p_business_id: businessA, p_order_id: orderId, p_amount: 300, p_method_label: "cash" });
  assert(await balance(clients.a, businessA, orderId) === 0, "Un nuevo cobro debe cerrar el saldo reabierto");
  await rpc(clients.a, "change_order_fulfillment", { p_business_id: businessA, p_order_id: orderId, p_next_status: "delivered" });
  const deliveredSummary = expectSuccess(await clients.a.rpc("get_business_dashboard", { p_business_id: businessA }), "Resumen tras entrega");
  assert(deliveredSummary[0].open_orders === 0 && deliveredSummary[0].pending_cents === 0,
    "El dashboard debe excluir el pedido entregado de abiertos y mantener el saldo en cero");

  const [orderHistory, paymentHistory, quotationHistory] = await Promise.all([
    clients.a.from("audit_events").select("action").eq("business_id", businessA).eq("entity_type", "order").eq("entity_id", orderId),
    clients.a.from("audit_events").select("action").eq("business_id", businessA).eq("action", "payment.reversed").contains("details", { order_id: orderId }),
    clients.a.from("audit_events").select("action").eq("business_id", businessA).eq("entity_type", "quotation").eq("entity_id", quotationId),
  ]);
  const orderEvents = expectSuccess(orderHistory, "Historial del pedido");
  const paymentEvents = expectSuccess(paymentHistory, "Historial de reversión");
  const quoteEvents = expectSuccess(quotationHistory, "Historial de cotización");
  assert(orderEvents.some((event) => event.action === "order.fulfillment.changed"), "El historial debe incluir preparación/entrega");
  assert(paymentEvents.length === 1 && quoteEvents.some((event) => event.action === "quotation.accepted"), "El historial debe incluir cobro revertido y aceptación");

  const orderB = await rpc(clients.b, "create_order_with_line", {
    p_business_id: businessB, p_customer_label: "Comprador de prueba B", p_description: "Mouse sintético E2E",
    p_sku: "E2E-MOUSE", p_quantity: 1, p_unit_price: 200,
  });
  const [aReadsB, bReadsOwn, bReadsA, crossCreate, crossMutation, crossCancel] = await Promise.all([
    clients.a.from("orders").select("id").eq("business_id", businessB),
    clients.b.from("orders").select("id").eq("business_id", businessB),
    clients.b.from("orders").select("id").eq("business_id", businessA),
    clients.a.rpc("create_order_with_line", { p_business_id: businessB, p_customer_label: "", p_description: "Intento cruzado", p_sku: "", p_quantity: 1, p_unit_price: 1 }),
    clients.a.rpc("change_order_fulfillment", { p_business_id: businessB, p_order_id: orderB, p_next_status: "preparing" }),
    clients.a.rpc("cancel_order", { p_business_id: businessB, p_order_id: orderB, p_reason: "Intento cruzado" }),
  ]);
  assert(expectSuccess(aReadsB, "Lectura cruzada A→B").length === 0, "A no debe leer pedidos de B");
  assert(expectSuccess(bReadsOwn, "Lectura propia B").length === 1, "B debe leer sus propios pedidos");
  assert(expectSuccess(bReadsA, "Lectura cruzada B→A").length === 0, "B no debe leer pedidos de A");
  assert(crossCreate.error?.code === "42501", "A no debe crear registros en el negocio B");
  assert(crossMutation.error?.code === "42501" || crossMutation.error?.code === "P0002", "A no debe mutar pedidos de B");
  assert(crossCancel.error?.code === "42501", "A no debe cancelar pedidos de B");
  await rpc(clients.b, "cancel_order", { p_business_id: businessB, p_order_id: orderB, p_reason: "Cancelación sintética" });
  const cancelledOrder = expectSuccess(await clients.b.from("orders").select("commercial_status, cancelled_reason").eq("business_id", businessB).eq("id", orderB).single(), "Lectura de cancelación");
  assert(cancelledOrder.commercial_status === "cancelled" && cancelledOrder.cancelled_reason === "Cancelación sintética", "B puede cancelar su pedido sin borrar su historial");

  const invalidQuantity = await clients.a.rpc("create_order_with_line", {
    p_business_id: businessA, p_customer_label: "", p_description: "Cantidad inválida", p_sku: "", p_quantity: 0, p_unit_price: 1,
  });
  assert(invalidQuantity.error?.message.includes("invalid_order_input"), "La cantidad cero debe rechazarse en PostgreSQL");
  const invalidPayment = await clients.a.rpc("record_order_payment", {
    p_business_id: businessA, p_order_id: orderId, p_amount: 0, p_method_label: "cash",
  });
  assert(invalidPayment.error?.message.includes("invalid_payment_input"), "Un cobro cero debe rechazarse en PostgreSQL");

  expectSuccess(await clients.a.auth.signOut(), "Cerrar sesión de usuario A");
  expectSuccess(await clients.b.auth.signOut(), "Cerrar sesión de usuario B");

  console.log("E2E local: registro, login, 2 comercios, cotización, aceptación idempotente, snapshots, preparación, anticipo, saldo, reversión única, nuevo cobro, historial y aislamiento A/B: OK");
} catch (error) {
  console.error(`E2E local falló: ${error instanceof Error ? error.message : "error inesperado"}`);
  process.exitCode = 1;
}
