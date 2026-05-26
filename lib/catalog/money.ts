export function formatEuro(cents: number) {
  return formatMoney(cents, "EUR");
}

export function formatMoney(cents: number, currency = "EUR") {
  const rates: Record<string, number> = {
    EUR: 1,
    GBP: 0.86,
    USD: 1.08
  };
  const locales: Record<string, string> = {
    EUR: "en-IE",
    GBP: "en-GB",
    USD: "en-US"
  };

  return new Intl.NumberFormat(locales[currency] || "en-IE", {
    style: "currency",
    currency
  }).format((cents / 100) * (rates[currency] || 1));
}
