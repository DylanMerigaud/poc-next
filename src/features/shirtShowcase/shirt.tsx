/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { useTexture, useGLTF, Decal } from "@react-three/drei";
import { type MeshProps, useFrame } from "@react-three/fiber";
import { useAtom } from "jotai";
import { easing } from "maath";
import { colorAtom, decalAtom } from "./atoms";
import { DecalPaths } from "./consts";

export function Shirt(props: MeshProps) {
  const [decal] = useAtom(decalAtom);
  const [color] = useAtom(colorAtom);
  const texture = useTexture(`/${decal}.png`);
  const { nodes, materials } = useGLTF(
    "/shirt_baked_collapsed.glb"
  ) as unknown as {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    nodes: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
}

useGLTF.preload("/shirt_baked_collapsed.glb");
Object.values(DecalPaths).forEach(useTexture.preload);
