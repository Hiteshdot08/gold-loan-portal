export const DUPLICATE_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export function maskMobile(mobile: string): string {
  return mobile.slice(0, 4) + "XXXX" + mobile.slice(-2);
}

export function toApplicationId(id: number): string {
  return `GL-${1000 + id}`;
}

export function gramsToMg(grams: number): number {
  return Math.round(grams * 1000);
}
