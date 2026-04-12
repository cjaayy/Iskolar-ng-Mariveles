export function coerceId(id: string): string | number {
  const numeric = Number(id);
  return Number.isFinite(numeric) ? numeric : id;
}
