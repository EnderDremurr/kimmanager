import clsx, { type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatEnkephalin(number?: number | null, defaultText?: string) {
  if (number === undefined || number === null || !isFinite(number)) {
    return defaultText ?? "0";
  }

  return number.toLocaleString("ru-RU", {
    maximumFractionDigits: 0,
  });
}
