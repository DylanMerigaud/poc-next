import { type Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { type AppType } from "next/app";
import { api } from "~/utils/api";
import "~/styles/globals.css";
import { atom, useAtom } from "jotai";
import { useBoolean } from "usehooks-ts";
import { useEffect } from "react";
import Navbar from "~/components/navbar";

export const THEMES = ["light", "dark"] as const;
export type Theme = (typeof THEMES)[number];
export const LOCALSTORAGE_THEME_KEY = "theme";
export const themeAtom = atom<Theme>("light");

const MyApp: AppType<{ session: Session | null }> = ({
  Component,
  pageProps: { session, ...pageProps },
}) => {
  const [theme, setTheme] = useAtom(themeAtom);

  useEffect(() => {
    if (
      window &&
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
    )
      setTheme("dark");
  }, []);

  useEffect(() => {
    if (
      localStorage &&
      THEMES.includes(localStorage.getItem(LOCALSTORAGE_THEME_KEY) as Theme)
    )
      setTheme(localStorage.getItem(LOCALSTORAGE_THEME_KEY) as Theme);
  }, []);

  const initialRenderBoolean = useBoolean(true);
  useEffect(() => {
    initialRenderBoolean.setFalse();
  }, []);

  useEffect(() => {
    if (!initialRenderBoolean.value)
      localStorage.setItem(LOCALSTORAGE_THEME_KEY, theme);
  }, [theme]);

  return (
    <SessionProvider session={session}>
      <div data-theme={theme}>
        <Component {...pageProps} />
      </div>
    </SessionProvider>
  );
};

export default api.withTRPC(MyApp);
