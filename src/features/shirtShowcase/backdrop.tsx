import { AccumulativeShadows, RandomizedLight } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useAtomValue } from "jotai";
import { easing } from "maath";
import { useRef } from "react";
import { colorAtom } from "./atoms";

export function Backdrop() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      temporal
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
