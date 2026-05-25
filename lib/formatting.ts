export const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);

export const formatPercent = (value: number) =>
  new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 1,
  }).format(value);

export const getInitials = (value: string) => {
  const initials = value
    .trim()
    .split(/\s+/)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return initials || "BT";
};
