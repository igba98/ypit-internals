export async function simulateDelay(ms = 300) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function generateId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).substr(2, 9)}`;
}

export function generateRegNumber(index: number) {
  return `YP-2026-${String(index).padStart(3, '0')}`;
}
