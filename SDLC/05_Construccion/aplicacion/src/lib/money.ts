const currencyFormatter = new Intl.NumberFormat("es-BO", {
  style: "currency",
  currency: "BOB",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function parseBobsToCents(value: string): number | null {
  const match = /^(\d{1,8})(?:\.(\d{1,2}))?$/.exec(value.trim());
  if (!match) return null;

  const cents = Number(match[1]) * 100 + Number((match[2] ?? "").padEnd(2, "0"));
  return Number.isSafeInteger(cents) ? cents : null;
}

export function parseQuantityToMilli(value: string): number | null {
  const match = /^(\d{1,5})(?:\.(\d{1,3}))?$/.exec(value.trim());
  if (!match) return null;

  const milli = Number(match[1]) * 1000 + Number((match[2] ?? "").padEnd(3, "0"));
  return Number.isSafeInteger(milli) ? milli : null;
}

export function centsToDecimal(cents: number): number {
  return Number((cents / 100).toFixed(2));
}

export function numericToCents(value: number | string): number {
  return Math.round(Number(value) * 100);
}

export function lineAmountCents(quantity: number, unitPriceCents: number): number {
  const quantityMilli = Math.round(quantity * 1000);
  return Math.round((quantityMilli * unitPriceCents) / 1000);
}

export function formatBobs(cents: number): string {
  return currencyFormatter.format(cents / 100);
}

export function formatQuantity(quantity: number): string {
  return new Intl.NumberFormat("es-BO", { maximumFractionDigits: 3 }).format(quantity);
}
