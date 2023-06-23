/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  AccumulativeShadows,
  RandomizedLight,
  useTexture,
  useGLTF,
  Decal,
  Center,
  Environment,
  CameraControls,
} from "@react-three/drei";
import {
  Canvas,
  type Vector3,
  useFrame,
  type MeshProps,
} from "@react-three/fiber";
import clsx from "clsx";
import { atom, useAtom, useAtomValue, useSetAtom } from "jotai";
import { easing } from "maath";
import { signIn, signOut, useSession } from "next-auth/react";
import Head from "next/head";
import Image from "next/image";
import {
  type PropsWithChildren,
  useEffect,
  useRef,
  useState,
  useMemo,
  useCallback,
  Children,
  type HtmlHTMLAttributes,
} from "react";
import { type Group } from "three";
import { api } from "~/utils/api";
import { produce } from "immer";
import { AnimatePresence, motion } from "framer-motion";
import {
  a,
  animated,
  useSpring,
  useTrail,
  useTransition,
} from "@react-spring/web";
import { useBoolean } from "usehooks-ts";

const DECALS = ["react", "dodgecoin", "nextjs"] as const;
type Decal = (typeof DECALS)[number];
const DecalNames: Record<Decal, string> = {
  react: "React",
  dodgecoin: "Dodgecoin",
  nextjs: "Next.js",
};

const COLORS = [
  "#ccc",
  "#EFBD4E",
  "#80C670",
  "#726DE8",
  "#EF674E",
  "#353934",
] as const;
type Color = (typeof COLORS)[number];
const ColorNames: Record<Color, string> = {
  "#ccc": "White",
  "#EFBD4E": "Yellow",
  "#80C670": "Green",
  "#726DE8": "Purple",
  "#EF674E": "Red",
  "#353934": "Black",
};

const SIZES = ["xs", "s", "m", "l", "xl", "xxl", "xxxl"] as const;
type Size = (typeof SIZES)[number];
const SizesStock: Record<Size, number> = {
  xs: 4,
  s: 6,
  m: 3,
  l: 0,
  xl: 5,
  xxl: 6,
  xxxl: 7,
};

const THEMES = ["light", "dark"] as const;
type Theme = (typeof THEMES)[number];
const LOCALSTORAGE_THEME_KEY = "theme";

const colorAtom = atom<Color>(COLORS[0]);
const sizeAtom = atom<Size | null>(null);
const quantityAtom = atom<number>(1);
const decalAtom = atom<Decal>(DECALS[0]);
const themeAtom = atom<Theme>("light");
const cartAtom = atom<
  { color: Color; quantity: number; size: Size; decal: Decal }[]
>([]);
const manualControlAtom = atom(false);
const overlayHoveredAtom = atom(false);

function Backdrop() {
  const shadows = useRef<any>();
  const color = useAtomValue(colorAtom);
  useFrame((_state, delta) =>
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    easing.dampC(shadows.current?.getMesh().material.color, color, 0.25, delta)
  );
  return (
    <AccumulativeShadows
      ref={shadows}
      frames={60}
      alphaTest={0.85}
      scale={12}
      rotation={[Math.PI / 2, 0, 0]}
      position={[0, 0, -0.22]}
    >
      <RandomizedLight
        amount={4}
        radius={9}
        intensity={0.55}
        ambient={0.25}
        position={[5, 5, -10]}
      />
      <RandomizedLight
        amount={4}
        radius={5}
        intensity={0.25}
        ambient={0.55}
        position={[-5, 5, -9]}
      />
    </AccumulativeShadows>
  );
}

function CameraRig({ children }: PropsWithChildren) {
  const group = useRef<Group>(null);
  const manualControl = useAtomValue(manualControlAtom);
  const overlayHovered = useAtomValue(overlayHoveredAtom);

  useFrame((state, delta) => {
    if (manualControl) {
      // state.camera.position.set(0, 0, 2);
      // state.camera.rotation.set(0, 0, 0);
      console.log(state.camera);
    } else {
      easing.damp3(state.camera.position, [0, 0, 2], 0.25, delta);
      if (group.current)
        easing.dampE(
          group.current.rotation,
          overlayHovered
            ? [0, 0, 0]
            : [state.pointer.y / 6, -state.pointer.x, 0],
          0.25,
          delta
        );
    }
  });
  return (
    <group ref={group}>
      {manualControl && <CameraControls />}
      {children}
    </group>
  );
}

const Shirt = (props: MeshProps) => {
  const [decal] = useAtom(decalAtom);
  const [color] = useAtom(colorAtom);
  const texture = useTexture(`/${decal}.png`);
  const { nodes, materials } = useGLTF(
    "/shirt_baked_collapsed.glb"
  ) as unknown as {
    nodes: any;
    materials: any;
  };
  useFrame((_state, delta) =>
    easing.dampC(materials.lambert1.color, color, 0.25, delta)
  );
  return (
    <mesh
      castShadow
      geometry={nodes.T_Shirt_male.geometry}
      material={materials.lambert1}
      material-roughness={1}
      {...props}
      dispose={null}
    >
      <Decal
        position={[0, 0.04, 0.15]}
        rotation={[0, 0, 0]}
        scale={0.15}
        map={texture}
        map-anisotropy={16}
      />
    </mesh>
  );
};

useGLTF.preload("/shirt_baked_collapsed.glb");
["/react.png", "/three2.png", "/pmndrs.png"].forEach(useTexture.preload);

const Overlay = () => {
  const [color, setColor] = useAtom(colorAtom);
  const [decal, setDecal] = useAtom(decalAtom);
  const [size, setSize] = useAtom(sizeAtom);
  const [quantity, setQuantity] = useAtom(quantityAtom);
  const [manualControl, setManualControl] = useAtom(manualControlAtom);
  const [theme, setTheme] = useAtom(themeAtom);
  const [cart, setCart] = useAtom(cartAtom);
  const [showAddedToCart, setShowAddedToCart] = useState(false);
  const [overlayHovered, setOverlayHovered] = useAtom(overlayHoveredAtom);
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

  const unitPrice = 45;
  const totalPrice = 45 * quantity;
  const overSelectedQuantity = !!size && SizesStock[size] < quantity;

  const handleMouseEnter = useCallback(() => {
    setOverlayHovered(true);
  }, [setOverlayHovered]);

  const handleMouseLeave = useCallback(() => {
    setOverlayHovered(false);
  }, [setOverlayHovered]);

  return (
    <div className="absolute inset-0 h-screen w-screen overflow-hidden [&>*]:z-10">
      <div className="navbar absolute top-0">
        <div className="flex-1">
          <a
            className="btn-ghost btn text-xl normal-case"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            STYLECROP
          </a>
        </div>
        <div className="flex-none">
          <div
            className={clsx("dropdown-end dropdown", {
              "tooltip-info tooltip-open tooltip tooltip-left": showAddedToCart,
            })}
            data-tip={
              showAddedToCart ? "Item was added in the cart" : undefined
            }
            onClick={() => {
              setShowAddedToCart(false);
            }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
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
              className="card dropdown-content card-compact z-[1] mt-3 w-52 bg-base-100 shadow"
            >
              <div className="card-body">
                <span className="text-lg font-bold">
                  {cart.reduce((acc, e) => e.quantity + acc, 0)} Items
                </span>
                <span className="text-info">
                  Subtotal:{" "}
                  {new Intl.NumberFormat("us-EN", {
                    style: "currency",
                    currency: "USD",
                  }).format(
                    cart.reduce((acc, e) => e.quantity * unitPrice + acc, 0)
                  )}
                </span>
                <ul className="flex flex-col gap-1">
                  {cart.map((item) => (
                    <li
                      className="text-base text-accent"
                      key={item.size + item.color + item.decal}
                    >
                      {item.quantity} Crew neck Tee-Shirt
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
                  <button className="btn-primary btn-block btn">
                    Checkout
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div
            className="dropdown-end dropdown"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <label tabIndex={0} className="btn-ghost btn-circle avatar btn">
              <div className="w-10 rounded-full">
                <Image
                  width={256}
                  height={256}
                  alt=""
                  src="/fake_profile.jpg"
                />
              </div>
            </label>
            <ul
              tabIndex={0}
              className="dropdown-content menu rounded-box menu-sm z-[1] mt-3 w-52 bg-base-100 p-2 shadow"
            >
              <li>
                <a className="justify-between">Profile</a>
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
                <a onClick={() => void signOut()}>Logout</a>
              </li>
              <li>
                <a onClick={() => void signIn()}>Sign In</a>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
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
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
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
              src={"/" + d + ".png"}
              alt={d}
            />
          </button>
        ))}
      </div>
      <button
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
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
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
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
              setQuantity((q) => Math.min(q, size ? sizesTempStock[size] : q));
            }}
            value={size || ""}
            className="select-bordered select flex-1"
          >
            <option disabled selected value={""}>
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
      {/* <div className="absolute bottom-6 right-6 flex flex-col gap-2 bg-slate-400 bg-opacity-5 p-2 shadow-lg">
        <button
          className={clsx(
            "flex h-14 w-14 items-center justify-center rounded-sm bg-slate-400 bg-opacity-10  hover:bg-opacity-20 hover:scale-105 active:bg-opacity-30",
            {
              "ring-2": manualControl,
            }
          )}
          onClick={() => setManualControl((v) => !v)}
        >
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
              d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3"
            />
          </svg>
        </button>
      </div> */}
    </div>
  );
};

const CanvasE = () => {
  const position: Vector3 = [0, 0, 2.5];
  const fov = 25;

  const [eventSource, setEventSource] = useState<HTMLElement | undefined>(
    undefined
  );
  useEffect(() => {
    const root = document.getElementById("root");
    if (root) setEventSource(root);
  }, []);

  return (
    <Canvas
      shadows
      camera={{ position, fov }}
      gl={{ preserveDrawingBuffer: true }}
      eventSource={eventSource}
      eventPrefix="client"
      className="absolute inset-0 h-screen w-screen"
      style={{ width: "100vw", height: "100vh" }}
    >
      <ambientLight intensity={0.5} />
      <Environment files="/default_env.hdr" />
      <CameraRig>
        <Backdrop />
        <Center>
          <Shirt />
        </Center>
      </CameraRig>
    </Canvas>
  );
};

const Trail: React.FC<
  PropsWithChildren<{ open: boolean } & HtmlHTMLAttributes<HTMLDivElement>>
> = ({ open, children, ...restProps }) => {
  const items = Children.toArray(children);
  const trail = useTrail(items.length, {
    config: { mass: 5, tension: 2000, friction: 200 },
    opacity: open ? 1 : 0,
    x: open ? 0 : 20,
    height: open ? 130 : 0,
    from: { opacity: 0, x: 20, height: 0 },
  });
  return (
    <div {...restProps}>
      {trail.map(({ height, ...style }, index) => (
        <a.div key={index} className="" style={style}>
          <a.div style={{ height }}>{items[index]}</a.div>
        </a.div>
      ))}
    </div>
  );
};

const Intro = ({ show }: { show: boolean }) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="absolute z-10 h-screen w-screen bg-base-100"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 2 }}
        >
          <Trail
            open={true}
            className="overflow-hidden text-9xl font-extrabold leading-[0.9] tracking-tighter will-change-[transform,opacity]"
          >
            <span>STYLECROP</span>
            <span>MAKES</span>
            <span>YOU</span>
            <span>UNIQUE</span>
          </Trail>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default function Home() {
  const hello = api.example.hello.useQuery({ text: "from tRPC" });

  const [theme, setTheme] = useAtom(themeAtom);
  const [intro, setIntro] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setIntro(false);
    }, 2000);
    return () => {
      clearTimeout(timeout);
    };
  }, []);

  useEffect(() => {
    console.log("1");
    if (
      window &&
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
    )
      setTheme("dark");
  }, [typeof window !== "undefined"]);

  useEffect(() => {
    console.log("2");

    if (
      localStorage &&
      THEMES.includes(localStorage.getItem(LOCALSTORAGE_THEME_KEY) as Theme)
    )
      setTheme(localStorage.getItem(LOCALSTORAGE_THEME_KEY) as Theme);
  }, [typeof localStorage !== "undefined"]);

  const initialRenderBoolean = useBoolean(true);
  useEffect(() => {
    initialRenderBoolean.setFalse();
  }, []);

  useEffect(() => {
    if (!initialRenderBoolean.value)
      localStorage.setItem(LOCALSTORAGE_THEME_KEY, theme);
  }, [theme]);

  return (
    <>
      <Head>
        <title>STYLECROP</title>
        <meta
          name="description"
          content="Welcome to StyleCrop, your ultimate destination for exquisite and luxurious fashion. Indulge in the epitome of style and sophistication with our premium collection of clothing. From timeless classics to cutting-edge designs, we offer an exquisite selection of premium garments crafted from the finest materials. Each piece embodies elegance, quality, and impeccable craftsmanship, ensuring you make a lasting impression wherever you go. Discover the perfect blend of comfort and elegance as you explore our diverse range of premium clothing. From formal occasions to casual outings, our collection caters to every fashion need, reflecting your unique personality and refined taste. Embrace a wardrobe that speaks volumes about your discerning style and exceptional taste. Shop now and experience the pinnacle of luxury fashion at StyleCrop."
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main data-theme={theme}>
        <Overlay />
        <Intro show={intro} />
        <CanvasE />
      </main>
    </>
  );
}
// export default function Home() {
//   const hello = api.example.hello.useQuery({ text: "from tRPC" });

//   return (
//     <>
//       <Head>
//         <title>Create T3 App</title>
//         <meta name="description" content="Generated by create-t3-app" />
//         <link rel="icon" href="/favicon.ico" />
//       </Head>
//       <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c]">
//         <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16 ">
//           <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-[5rem]">
//             Create <span className="text-[hsl(280,100%,70%)]">T3</span> App
//           </h1>
//           <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-8">
//             <Link
//               className="flex max-w-xs flex-col gap-4 rounded-xl bg-white/10 p-4 text-white hover:bg-white/20"
//               href="https://create.t3.gg/en/usage/first-steps"
//               target="_blank"
//             >
//               <h3 className="text-2xl font-bold">First Steps →</h3>
//               <div className="text-lg">
//                 Just the basics - Everything you need to know to set up your
//                 database and authentication.
//               </div>
//             </Link>
//             <Link
//               className="flex max-w-xs flex-col gap-4 rounded-xl bg-white/10 p-4 text-white hover:bg-white/20"
//               href="https://create.t3.gg/en/introduction"
//               target="_blank"
//             >
//               <h3 className="text-2xl font-bold">Documentation →</h3>
//               <div className="text-lg">
//                 Learn more about Create T3 App, the libraries it uses, and how
//                 to deploy it.
//               </div>
//             </Link>
//           </div>
//           <div className="flex flex-col items-center gap-2">
//             <p className="text-2xl text-white">
//               {hello.data ? hello.data.greeting : "Loading tRPC query..."}
//             </p>
//             <AuthShowcase />
//           </div>
//         </div>
//       </main>
//     </>
//   );
// }

function AuthShowcase() {
  const { data: sessionData } = useSession();

  const { data: secretMessage } = api.example.getSecretMessage.useQuery(
    undefined, // no input
    { enabled: sessionData?.user !== undefined }
  );

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <p className="text-center text-2xl text-white">
        {sessionData && <span>Logged in as {sessionData.user?.name}</span>}
        {secretMessage && <span> - {secretMessage}</span>}
      </p>
      <button
        className="rounded-full bg-white/10 px-10 py-3 font-semibold text-white no-underline transition hover:bg-white/20"
        onClick={sessionData ? () => void signOut() : () => void signIn()}
      >
        {sessionData ? "Sign out" : "Sign in"}
      </button>
    </div>
  );
}
