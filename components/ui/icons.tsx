import type { ReactNode, SVGProps } from "react";
import type { IngredientId } from "@/lib/data";

type IconProps = SVGProps<SVGSVGElement>;

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

export function CupLogo(props: IconProps) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden {...props}>
      <path d="M12 3.5c-1.4 1.6 1.4 3.2 0 4.8M16.5 2.5c-1.4 1.6 1.4 3.2 0 4.8" {...stroke} strokeWidth={1.5} />
      <path d="M6 11.5h17v6.5a7.5 7.5 0 0 1-7.5 7.5h-2A7.5 7.5 0 0 1 6 18z" fill="currentColor" />
      <path d="M23 13.5h1.6a3.2 3.2 0 0 1 0 6.4H22.4" {...stroke} strokeWidth={2} />
      <path d="M4 28.5h21" {...stroke} strokeWidth={1.8} />
    </svg>
  );
}

export function BeanIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden {...props}>
      <ellipse cx="12" cy="12" rx="6.5" ry="9" transform="rotate(35 12 12)" fill="currentColor" />
      <path d="M15.8 5.6c-4.6 1.8-3 7.6-7.6 12.8" fill="none" stroke="var(--color-paper, #fff)" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

const INGREDIENT_PATHS: Record<IngredientId, ReactNode> = {
  milk: (
    <>
      <path d="M8.5 2.5h7v2.8l2.5 3.4V20a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 20V8.7l2.5-3.4z" />
      <path d="M6 9h12" />
      <path d="M9 14.2c1-.9 2 .9 3 0s2-.9 3 0" />
    </>
  ),
  oat: (
    <>
      <path d="M12 21.5V8" />
      <path d="M12 8c-2.2-.3-3.4-2-3.2-4.4C11 4 12.2 5.6 12 8Zm0 0c2.2-.3 3.4-2 3.2-4.4C13 4 11.8 5.6 12 8Z" />
      <path d="M12 12.8c-2.3-.2-3.6-1.8-3.6-4.2 2.3.2 3.6 1.9 3.6 4.2Zm0 0c2.3-.2 3.6-1.8 3.6-4.2-2.3.2-3.6 1.9-3.6 4.2Z" />
      <path d="M12 17.5c-2.3-.2-3.6-1.8-3.6-4.2 2.3.2 3.6 1.9 3.6 4.2Zm0 0c2.3-.2 3.6-1.8 3.6-4.2-2.3.2-3.6 1.9-3.6 4.2Z" />
    </>
  ),
  caramel: (
    <>
      <path d="M12 2.8c3.2 4.1 5.2 7 5.2 9.9a5.2 5.2 0 0 1-10.4 0c0-2.9 2-5.8 5.2-9.9Z" />
      <path d="M9.4 13.6c.9.9 2 .9 2.8 0s1.9-.9 2.8 0" />
    </>
  ),
  cinnamon: (
    <>
      <rect x="2.5" y="9.3" width="17" height="4.2" rx="2.1" transform="rotate(-32 11 11.4)" />
      <rect x="4.5" y="13.3" width="17" height="4.2" rx="2.1" transform="rotate(-32 13 15.4)" />
      <path d="M17.6 5.9a1.4 1.4 0 1 0 1 2.2" />
    </>
  ),
  chocolate: (
    <>
      <path d="M6.5 3h11A1.5 1.5 0 0 1 19 4.5v12.2L14.7 21H6.5A1.5 1.5 0 0 1 5 19.5v-15A1.5 1.5 0 0 1 6.5 3Z" />
      <path d="M5 9h14M5 15h14M12 3v18" />
    </>
  ),
  cream: (
    <>
      <path d="M5.5 13.5h13" />
      <path d="M6.5 13.5c-.6-1.9.6-3.3 2.4-3.2-.4-2 1.1-3.4 3-3.2-.1-1.7.9-2.8 2.2-3.3.1 1.6 1 2.6 1 3.9 1.8.4 2.7 1.7 2.1 3.2 1.2.5 1.6 1.5 1.3 2.6" />
      <path d="M7 13.5 8.6 20a1.5 1.5 0 0 0 1.4 1.1h4a1.5 1.5 0 0 0 1.4-1.1l1.6-6.5" />
    </>
  ),
  shot: (
    <>
      <path d="M6.5 7.5h11l-1.4 11.8a2 2 0 0 1-2 1.7H9.9a2 2 0 0 1-2-1.7Z" />
      <path d="M7.2 12.5h9.6" />
      <path d="M10 2.5c-.8.9.8 1.8 0 2.7M14 2.5c-.8.9.8 1.8 0 2.7" />
    </>
  ),
};

export function IngredientIcon({ id, ...props }: IconProps & { id: IngredientId }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden {...stroke} {...props}>
      {INGREDIENT_PATHS[id]}
    </svg>
  );
}

export function InstagramIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden {...stroke} {...props}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.4" cy="6.6" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function FacebookIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden {...stroke} {...props}>
      <path d="M14.5 21v-7.5h2.7l.5-3.3h-3.2V8.3c0-1 .5-1.8 1.9-1.8h1.4V3.6s-1.3-.2-2.5-.2c-2.6 0-4.1 1.5-4.1 4.3v2.5H8.3v3.3h2.9V21" />
    </svg>
  );
}

export function TikTokIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden {...stroke} {...props}>
      <path d="M14 3v11.6a3.6 3.6 0 1 1-3.6-3.6" />
      <path d="M14 3c.4 2.6 2.2 4.4 5 4.7" />
    </svg>
  );
}
