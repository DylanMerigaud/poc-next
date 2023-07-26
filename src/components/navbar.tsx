import clsx from "clsx";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { signIn, signOut, useSession } from "next-auth/react";
import Link from "next/link";
import React, { useCallback, useState } from "react";
import {
  ColorNames,
  DecalNames,
  cartAtom,
  overlayHoveredAtom,
  unitPrice,
} from "~/pages";
import { themeAtom, THEMES } from "~/pages/_app";

export type NavbarProps = {
  overContent?: boolean;
};
export default function Navbar(props: NavbarProps) {
  const { overContent = false } = props;
  const [theme, setTheme] = useAtom(themeAtom);
  const setOverlayHovered = useSetAtom(overlayHoveredAtom);
  const [showAddedToCart, setShowAddedToCart] = useState(false);
  const cart = useAtomValue(cartAtom);
  const { data: sessionData, status: sessionStatus } = useSession();

  const handleOverlayMouseEnter = useCallback(() => {
    setOverlayHovered(true);
  }, [setOverlayHovered]);

  const handleOverlayMouseLeave = useCallback(() => {
    setOverlayHovered(false);
  }, [setOverlayHovered]);
  return (
    <div className={clsx("navbar z-10", { absolute: overContent })}>
      <div className="flex-1">
        <Link
          className="btn-ghost btn text-xl normal-case"
          onMouseEnter={handleOverlayMouseEnter}
          onMouseLeave={handleOverlayMouseLeave}
          href="/?intro=false"
        >
          STYLECROP
        </Link>
      </div>
      <div className="flex-none">
        <div
          className={clsx("dropdown-end dropdown", {
            "tooltip-info tooltip-open tooltip tooltip-left": showAddedToCart,
          })}
          data-tip={showAddedToCart ? "Item was added in the cart" : undefined}
          onClick={() => {
            setShowAddedToCart(false);
          }}
          onMouseEnter={handleOverlayMouseEnter}
          onMouseLeave={handleOverlayMouseLeave}
        >
          <label tabIndex={0} className="btn-ghost btn-circle btn">
            <div className="indicator">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <span className="badge badge-sm indicator-item">
                {cart.reduce((acc, e) => e.quantity + acc, 0)}
              </span>
            </div>
          </label>
          <div
            tabIndex={0}
            className="card-compact card dropdown-content z-[1] mt-3 w-52 bg-base-100 shadow"
          >
            <div className="card-body">
              <div className="text-lg font-bold">
                {cart.reduce((acc, e) => e.quantity + acc, 0)} Items
              </div>
              <div className="flex text-info">
                <div className="flex-1">Subtotal: </div>
                <div>
                  {new Intl.NumberFormat("us-EN", {
                    style: "currency",
                    currency: "USD",
                  }).format(
                    cart.reduce((acc, e) => e.quantity * unitPrice + acc, 0)
                  )}
                </div>
              </div>
              <ul className="flex flex-col gap-1">
                {cart.map((item) => (
                  <li
                    className="text-base text-accent"
                    key={item.size + item.color + item.decal}
                  >
                    <div className="flex">
                      <div className="flex-1">
                        {item.quantity} Crew neck Tee-Shirt
                      </div>
                      <div>
                        {" "}
                        {new Intl.NumberFormat("us-EN", {
                          style: "currency",
                          currency: "USD",
                        }).format(item.quantity * unitPrice)}
                      </div>
                    </div>
                    <ul className="text-xs text-accent-content">
                      {[
                        `${ColorNames[item.color]}`,
                        `${item.size.toUpperCase()}`,
                        `${DecalNames[item.decal]} decal`,
                      ].join(" | ")}
                    </ul>
                  </li>
                ))}
              </ul>
              <div className="card-actions">
                <Link
                  className={clsx("btn-primary btn-block btn", {
                    "btn-disabled": !cart.length,
                  })}
                  href={cart.length && sessionData ? "/checkout" : ""}
                  onClick={() => {
                    if (!sessionData) void signIn();
                  }}
                >
                  Checkout
                </Link>
              </div>
            </div>
          </div>
        </div>
        {(() => {
          if (sessionStatus === "loading")
            return <div className="loading loading-ring loading-lg w-12"></div>;
          return !sessionData ? (
            <button
              onClick={() => void signIn()}
              className="btn-primary btn-outline btn"
            >
              Sign In
            </button>
          ) : (
            <div
              className="dropdown-end dropdown"
              onMouseEnter={handleOverlayMouseEnter}
              onMouseLeave={handleOverlayMouseLeave}
            >
              <label tabIndex={0} className="btn-ghost btn-circle avatar btn">
                <div className="w-10 rounded-full">
                  <img
                    referrerPolicy="no-referrer"
                    width={256}
                    height={256}
                    alt=""
                    src={sessionData?.user?.image || "/default_profile.jpg"}
                  />
                </div>
              </label>
              <ul
                tabIndex={0}
                className="dropdown-content menu rounded-box menu-sm z-[1] mt-3 w-52 bg-base-100 p-2 shadow"
              >
                <li>
                  <Link className="justify-between" href="/profile">
                    Profile
                  </Link>
                </li>
                <li>
                  <a
                    onClick={() => {
                      setTheme(
                        (t) =>
                          THEMES.at(THEMES.findIndex((e) => e === t) + 1) ||
                          THEMES[0]
                      );
                    }}
                  >
                    Switch to{" "}
                    {THEMES.at(THEMES.findIndex((e) => e === theme) + 1) ||
                      THEMES[0]}{" "}
                    theme
                  </a>
                </li>
                <li>
                  <a>Settings</a>
                </li>
                <li>
                  <a className="justify-between">
                    Orders
                    <span className="badge">New</span>
                  </a>
                </li>
                <li>
                  <a onClick={() => void signOut()}>Sign Out</a>
                </li>
              </ul>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
