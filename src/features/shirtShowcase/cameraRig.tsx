import { useFrame } from "@react-three/fiber";
import { useAtomValue } from "jotai";
import { easing } from "maath";
import { type PropsWithChildren, useRef } from "react";
import { type Group } from "three";
import { overlayHoveredAtom } from "./atoms";

export function CameraRig({ children }: PropsWithChildren) {
  const group = useRef<Group>(null);
  const overlayHovered = useAtomValue(overlayHoveredAtom);

  useFrame((state, delta) => {
    easing.damp3(state.camera.position, [0, 0, 2], 0.25, delta);
    if (group.current)
      easing.dampE(
        group.current.rotation,
        overlayHovered ? [0, 0, 0] : [state.pointer.y / 6, -state.pointer.x, 0],
        0.25,
        delta
      );
  });
  return <group ref={group}>{children}</group>;
}
