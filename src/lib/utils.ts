import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string, locale: string = 'en') {
  const d = new Date(date);
  return d.toLocaleDateString(locale === 'kh' ? 'km-KH' : 'en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
}
