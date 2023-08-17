import clsx from "clsx";
import { produce } from "immer";
import { useAtom, useSetAtom } from "jotai";
import { useState, useRef, useMemo, useCallback } from "react";
import {
  colorAtom,
  decalAtom,
  sizeAtom,
  quantityAtom,
  cartAtom,
  overlayHoveredAtom,
} from "./atoms";
import {
  SizesStock,
  COLORS,
  ColorNames,
  DECALS,
  DecalNames,
  DecalPaths,
  unitPrice,
  SIZES,
  type Size,
} from "./consts";
import Image from "next/image";

export function Overlay() {
  const [color, setColor] = useAtom(colorAtom);
  const [decal, setDecal] = useAtom(decalAtom);
  const [size, setSize] = useAtom(sizeAtom);
  const [quantity, setQuantity] = useAtom(quantityAtom);
  const [cart, setCart] = useAtom(cartAtom);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_showAddedToCart, setShowAddedToCart] = useState(false);
  const setOverlayHovered = useSetAtom(overlayHoveredAtom);
  const showAddedToCartTimeout = useRef<NodeJS.Timeout | null>(null);

  const sizesTempStock = useMemo(
    () =>
      Object.keys(SizesStock).reduce(
        (res, k) => {
          const key = k as Size;
          res[key] =
            SizesStock[key] -
            (cart.find((item) => item.size === key) || { quantity: 0 })
              .quantity;
          return res;
        },
        { ...SizesStock }
      ),
    [cart]
  );

  const totalPrice = 45 * quantity;
  const overSelectedQuantity = !!size && SizesStock[size] < quantity;

  const handleOverlayMouseEnter = useCallback(() => {
    setOverlayHovered(true);
  }, [setOverlayHovered]);

  const handleOverlayMouseLeave = useCallback(() => {
    setOverlayHovered(false);
  }, [setOverlayHovered]);

  return (
    <>
      <div
        onMouseEnter={handleOverlayMouseEnter}
        onMouseLeave={handleOverlayMouseLeave}
        className="card absolute bottom-60 left-6 flex flex-col gap-2 bg-slate-400 bg-opacity-10 p-2 shadow-lg "
      >
        {COLORS.map((c) => (
          <button
            key={c}
            className={clsx(
              "tooltip-info tooltip tooltip-right h-8 w-8 rounded-full hover:scale-110",
              c === color ? "ring-2" : "ring-1 ring-white"
            )}
            data-tip={ColorNames[c]}
            style={{ background: c }}
            onClick={() => setColor(c)}
          ></button>
        ))}
      </div>
      <div
        onMouseEnter={handleOverlayMouseEnter}
        onMouseLeave={handleOverlayMouseLeave}
        className="card absolute bottom-6 left-6 flex flex-col gap-2 bg-slate-400 bg-opacity-5 p-2 shadow-lg"
      >
        {DECALS.map((d) => (
          <button
            key={d}
            className={clsx(
              "tooltip-info tooltip tooltip-right flex h-14 w-14 items-center justify-center rounded-sm bg-slate-400 bg-opacity-10 hover:scale-105 hover:bg-opacity-20 active:bg-opacity-30",
              {
                "ring-2": d === decal,
              }
            )}
            data-tip={DecalNames[d]}
            onClick={() => setDecal(d)}
          >
            <Image
              className="scale-90"
              width={64}
              height={64}
              src={DecalPaths[d]}
              alt={d}
            />
          </button>
        ))}
      </div>
      <button
        onMouseEnter={handleOverlayMouseEnter}
        onMouseLeave={handleOverlayMouseLeave}
        className="absolute bottom-6 left-28 flex gap-2 rounded-2xl bg-slate-400 bg-opacity-10 p-2 text-secondary shadow-lg hover:scale-105 hover:bg-opacity-20 active:bg-opacity-30"
        onClick={() => {
          const link = document.createElement("a");
          const data = document
            .querySelector("canvas")
            ?.toDataURL("image/png")
            .replace("image/png", "image/octet-stream");
          if (!data) return;
          link.setAttribute("download", "teeshirt_preview.png");
          link.setAttribute("href", data);
          link.click();
        }}
      >
        Download preview
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="h-6 w-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
          />
        </svg>
      </button>
      <form
        onMouseEnter={handleOverlayMouseEnter}
        onMouseLeave={handleOverlayMouseLeave}
        className="card absolute bottom-5 right-6 flex flex-col gap-2 bg-slate-400 bg-opacity-10 p-2 shadow-lg"
        onSubmit={(e) => {
          e.preventDefault();

          setShowAddedToCart(true);
          if (showAddedToCartTimeout.current) {
            clearTimeout(showAddedToCartTimeout.current);
            showAddedToCartTimeout.current = null;
          }
          showAddedToCartTimeout.current = setTimeout(
            () => setShowAddedToCart(false),
            3000
          );
          setCart((cart) =>
            produce(cart, (draft) => {
              const foundIndex = draft.findIndex(
                (e) => e.color === color && e.size === size && e.decal === decal
              );
              if (foundIndex === -1)
                return [
                  ...cart,
                  { size: size as Size, quantity, color, decal },
                ];
              const foundElem = draft[foundIndex];
              if (foundElem) foundElem.quantity += quantity;
            })
          );
          setQuantity((q) => Math.min(q, size ? sizesTempStock[size] - q : q));
        }}
      >
        <h1 className="flex items-center gap-4 text-3xl text-accent">
          Crew neck Tee-Shirt{" "}
          <div className="flex items-center gap-2">
            <div
              className={"h-4 w-4 rounded-full ring-1 ring-white"}
              style={{ background: color }}
            />
            <span className="text-sm">{ColorNames[color]}</span>
          </div>
        </h1>
        <ul className="text-sm text-accent-content">
          <li>Ultimate Comfort. Flawless Fit.</li>
          <li>Timeless Elegance. Unmatched Quality.</li>
          <li>Built to Last. Stylishly Strong.</li>
          <li>Fashion with a Conscience.</li>
          <li>Standout Style. Eco-Friendly Essence.</li>
          <li>Versatile. Unforgettable. You.</li>
          <li>Confidence Begins Here.</li>
          <li>Luxurious Comfort. Unbeatable Style.</li>
        </ul>
        <div className="text-info">
          {new Intl.NumberFormat("us-EN", {
            style: "currency",
            currency: "USD",
          }).format(unitPrice)}
        </div>
        <div className="flex gap-2">
          <select
            required
            onChange={(e) => {
              setSize(e.target.value as Size);
              setQuantity((q) =>
                Math.min(
                  q,
                  e.target.value ? sizesTempStock[e.target.value as Size] : q
                )
              );
            }}
            value={size || ""}
            className="select-bordered select flex-1"
          >
            <option disabled value={""}>
              Choose your size
            </option>
            {SIZES.map((s) => {
              const stockNumber = sizesTempStock[s];
              const outOfStock = stockNumber === 0;

              return (
                <option disabled={outOfStock} value={s} key={s}>
                  {s.toUpperCase()} ({outOfStock ? "Out of Stock" : stockNumber}
                  )
                </option>
              );
            })}
          </select>
          <input
            required
            type="number"
            placeholder="Quantity"
            className="input-bordered input min-w-0 flex-1"
            min="1"
            onKeyDown={(e) => {
              if ([".", "-"].includes(e.key)) e.preventDefault();
            }}
            value={quantity}
            onChange={(e) => {
              const sanitized = e.target.value
                .replace(/\-/g, "")
                .replace(/\./g, "");

              setQuantity(
                Math.min(
                  parseInt(sanitized) || 0,
                  size ? sizesTempStock[size] : Infinity
                )
              );
            }}
          />
        </div>
        <button className="btn-primary btn" disabled={overSelectedQuantity}>
          Add to Cart{" "}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            className="h-6 w-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
            />
          </svg>{" "}
          (
          {new Intl.NumberFormat("us-EN", {
            style: "currency",
            currency: "USD",
          }).format(totalPrice)}
          )
        </button>
      </form>
    </>
  );
}
