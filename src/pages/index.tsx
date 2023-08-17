import Head from "next/head";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useNextQueryParam } from "~/utils/router";
import Navbar from "~/components/navbar";
import { Canvas } from "~/features/shirtShowcase/canvas";
import { Overlay } from "~/features/shirtShowcase/overlay";
import { Intro } from "~/features/intro/intro";

export default function Home() {
  const router = useRouter();
  const introParam = useNextQueryParam("intro");
  const [intro, setIntro] = useState<boolean | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setIntro(false);
      void router.replace({
        query: { ...router.query, intro: false },
      });
    }, 2000);
    return () => {
      clearTimeout(timeout);
    };
  }, [router]);

  useEffect(() => {
    setIntro(true);
  }, []);
  useEffect(() => {
    if (introParam === "false") setIntro(false);
  }, [introParam]);

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
      <div>
        <Navbar overContent />
        <Canvas />
        <Overlay />
        {intro === null ? (
          <div className="absolute z-10 h-screen w-screen bg-base-100" />
        ) : (
          <Intro show={intro} />
        )}
      </div>
    </>
  );
}
