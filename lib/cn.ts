export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export const EASE_SOFT = [0.22, 1, 0.36, 1] as const;
