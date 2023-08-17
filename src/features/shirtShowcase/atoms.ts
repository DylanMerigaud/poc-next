import { atom } from "jotai";
import { COLORS, type Color, type Decal, DECALS, type Size } from "./consts";

export const colorAtom = atom<Color>(COLORS[0]);
export const sizeAtom = atom<Size | null>(null);
export const quantityAtom = atom<number>(1);
export const decalAtom = atom<Decal>(DECALS[0]);
export const cartAtom = atom<
  { color: Color; quantity: number; size: Size; decal: Decal }[]
>([]);
export const overlayHoveredAtom = atom(false);
