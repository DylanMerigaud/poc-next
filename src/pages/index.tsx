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
import { type PropsWithChildren, useEffect, useRef, useState } from "react";
import { type Group } from "three";
import { api } from "~/utils/api";
import { themeChange } from "theme-change";

const DECALS = ["react", "dodgecoin", "nextjs"] as const;
type Decal = (typeof DECALS)[number];

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

const colorAtom = atom<Color>(COLORS[0]);
const sizeAtom = atom<Size | null>(null);
const quantityAtom = atom<number>(1);
const decalAtom = atom<Decal>(DECALS[0]);
const cartAtom = atom<{ color: Color; quantity: number }[]>([]);
const manualControlAtom = atom(false);

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
          [state.pointer.y / 6, -state.pointer.x, 0],
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
  const { nodes, materials } = useGLTF("/shirt_baked_collapsed.glb");
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
  const [cart, setCart] = useAtom(cartAtom);
  const [showAddedToCart, setShowAddedToCart] = useState(false);
  const showAddedToCartTimeout = useRef<number | null>(null);

  const unitPrice = 45;
  const totalPrice = 45 * quantity;
  const overSelectedQuantity = SizesStock[size] < quantity;

  return (
    <main className="absolute inset-0 h-screen w-screen overflow-hidden [&>*]:z-10 ">
      <div className="navbar absolute top-0">
        <div className="flex-1">
          <a className="btn-ghost btn text-xl normal-case">STYLECROP</a>
        </div>
        <div className="flex-none">
          <div
            className={clsx("dropdown-end dropdown", {
              "tooltip-info tooltip-open tooltip tooltip-bottom":
                showAddedToCart,
            })}
            data-tip={
              showAddedToCart ? "Item was added in the cart" : undefined
            }
            onClick={() => {
              setShowAddedToCart(false);
            }}
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
                <div className="card-actions">
                  <button className="btn-primary btn-block btn">
                    Checkout
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="dropdown-end dropdown">
            <label tabIndex={0} className="btn-ghost btn-circle avatar btn">
              <div className="w-10 rounded-full">
                <img src="/fake_profile.jpg" />
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
                <a data-toggle-theme="dark,light" data-act-class="ACTIVECLASS">
                  Switch theme
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
                <a>Logout</a>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="card absolute bottom-60 left-6 flex flex-col gap-2 bg-slate-400 bg-opacity-10 p-2 shadow-lg ">
        {COLORS.map((c) => (
          <button
            key={c}
            className={clsx(
              "h-8 w-8 rounded-full hover:scale-110",
              c === color ? "ring-2" : "ring-1 ring-white"
            )}
            style={{ background: c }}
            onClick={() => setColor(c)}
          ></button>
        ))}
      </div>
      <div className="card absolute bottom-6 left-6 flex flex-col gap-2 bg-slate-400 bg-opacity-5 p-2 shadow-lg">
        {DECALS.map((d) => (
          <button
            key={d}
            className={clsx(
              "flex h-14 w-14 items-center justify-center rounded-sm bg-slate-400 bg-opacity-10 hover:scale-105 hover:bg-opacity-20 active:bg-opacity-30",
              {
                "ring-2": d === decal,
              }
            )}
            onClick={() => setDecal(d)}
          >
            <Image
              width={50}
              height={50}
              src={"/" + d + "_thumb.png"}
              alt={d}
            />
          </button>
        ))}
      </div>
      <button
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
          setCart((cart) => [...cart, { size, quantity, color: color }]);
        }}
      >
        <h1 className="flex items-center gap-4 text-3xl text-accent">
          Crew neck T-Shirt{" "}
          <div className="flex items-center gap-2">
            <div
              className={"h-4 w-4 rounded-full"}
              style={{ background: color }}
            />
            <span className="text-sm">({ColorNames[color]})</span>
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
            }}
            value={size || ""}
            className="select-bordered select flex-1"
          >
            <option disabled selected value={""}>
              Choose your size
            </option>
            {SIZES.map((s) => {
              const stockNumber = SizesStock[s];
              const outOfStock = stockNumber === 0;

              return (
                <option
                  disabled={outOfStock}
                  selected={size === s}
                  value={s}
                  key={s}
                >
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
            defaultValue={quantity}
            onKeyDown={(e) => {
              if ([".", "-"].includes(e.key)) e.preventDefault();
            }}
            onChange={(e) => {
              const sanitized = e.target.value
                .replace(/\-/g, "")
                .replace(/\./g, "");

              setQuantity(parseInt(sanitized) || 0);
            }}
          />
        </div>
        <button
          className="btn-primary btn"
          disabled={!size || !totalPrice || overSelectedQuantity}
        >
          Add to Cart{" "}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="h-6 w-6"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
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
    </main>
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

export default function Home() {
  const hello = api.example.hello.useQuery({ text: "from tRPC" });

  return (
    <>
      <Head>
        <title>Create T3 App</title>
        <meta name="description" content="Generated by create-t3-app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Overlay />
      <CanvasE />
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
