export const DECALS = ["react", "dodgecoin", "nextjs"] as const;
export type Decal = (typeof DECALS)[number];
export const DecalNames: Record<Decal, string> = {
  react: "React",
  dodgecoin: "Dodgecoin",
  nextjs: "Next.js",
};
export const DecalPaths: Record<Decal, string> = DECALS.reduce(
  (r, d) => ({ ...r, [d]: `/${d}.png` }),
  {} as Record<Decal, string>
);

export const COLORS = [
  "#ccc",
  "#EFBD4E",
  "#80C670",
  "#726DE8",
  "#EF674E",
  "#353934",
] as const;
export type Color = (typeof COLORS)[number];
export const ColorNames: Record<Color, string> = {
  "#ccc": "White",
  "#EFBD4E": "Yellow",
  "#80C670": "Green",
  "#726DE8": "Purple",
  "#EF674E": "Red",
  "#353934": "Black",
};
export const unitPrice = 45;

export const SIZES = ["xs", "s", "m", "l", "xl", "xxl", "xxxl"] as const;
export type Size = (typeof SIZES)[number];
export const SizesStock: Record<Size, number> = {
  xs: 4,
  s: 6,
  m: 3,
  l: 0,
  xl: 5,
  xxl: 6,
  xxxl: 7,
};
