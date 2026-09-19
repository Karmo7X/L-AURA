import { create } from "zustand";
import { BASE_DRINK, INGREDIENTS, MILK_IDS, type IngredientId } from "./data";

export interface CartItem {
  key: string;
  name: string;
  detail?: string;
  price: number;
  qty: number;
  image?: string;
}

interface Toast {
  id: number;
  message: string;
}

interface CafeState {
  /* Customizer */
  selected: IngredientId[];
  toggleIngredient: (id: IngredientId) => void;
  removeIngredient: (id: IngredientId) => void;

  /* Hero / 3D */
  heroFilled: boolean;
  setHeroFilled: (filled: boolean) => void;
  pourKey: number;
  replayPour: () => void;
  webgl: "loading" | "ready" | "failed";
  setWebgl: (status: CafeState["webgl"]) => void;

  /* Order */
  cart: CartItem[];
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  addToCart: (item: Omit<CartItem, "qty">) => void;
  changeQty: (key: string, delta: number) => void;
  removeFromCart: (key: string) => void;
  clearCart: () => void;

  toast: Toast | null;
  showToast: (message: string) => void;
}

let toastTimer: ReturnType<typeof setTimeout> | undefined;

export const useCafe = create<CafeState>((set, get) => ({
  selected: [],
  toggleIngredient: (id) =>
    set(({ selected }) => {
      if (selected.includes(id)) return { selected: selected.filter((s) => s !== id) };
      // Only one milk at a time — picking oat swaps out dairy and vice versa.
      const next = MILK_IDS.includes(id) ? selected.filter((s) => !MILK_IDS.includes(s)) : selected;
      return { selected: [...next, id] };
    }),
  removeIngredient: (id) => set(({ selected }) => ({ selected: selected.filter((s) => s !== id) })),

  heroFilled: false,
  setHeroFilled: (heroFilled) => set({ heroFilled }),
  pourKey: 0,
  replayPour: () => set(({ pourKey }) => ({ pourKey: pourKey + 1 })),
  webgl: "loading",
  setWebgl: (webgl) => set({ webgl }),

  cart: [],
  cartOpen: false,
  setCartOpen: (cartOpen) => set({ cartOpen }),
  addToCart: (item) =>
    set(({ cart }) => {
      const existing = cart.find((c) => c.key === item.key);
      if (existing) {
        return { cart: cart.map((c) => (c.key === item.key ? { ...c, qty: c.qty + 1 } : c)) };
      }
      return { cart: [...cart, { ...item, qty: 1 }] };
    }),
  changeQty: (key, delta) =>
    set(({ cart }) => ({
      cart: cart
        .map((c) => (c.key === key ? { ...c, qty: c.qty + delta } : c))
        .filter((c) => c.qty > 0),
    })),
  removeFromCart: (key) => set(({ cart }) => ({ cart: cart.filter((c) => c.key !== key) })),
  clearCart: () => set({ cart: [] }),

  toast: null,
  showToast: (message) => {
    clearTimeout(toastTimer);
    set({ toast: { id: Date.now(), message } });
    toastTimer = setTimeout(() => {
      if (get().toast?.message === message) set({ toast: null });
    }, 2600);
  },
}));

export function customTotal(selected: IngredientId[]) {
  return selected.reduce(
    (sum, id) => sum + (INGREDIENTS.find((i) => i.id === id)?.price ?? 0),
    BASE_DRINK.price,
  );
}

export function formatPrice(value: number) {
  return `$${value.toFixed(2)}`;
}
