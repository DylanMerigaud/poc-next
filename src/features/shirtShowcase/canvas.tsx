import { Environment, Center } from "@react-three/drei";
import { type Vector3, Canvas as FiberCanvas } from "@react-three/fiber";
import { useState, useEffect } from "react";
import { CameraRig } from "./cameraRig";
import { Backdrop } from "./backdrop";
import { Shirt } from "./shirt";

export function Canvas() {
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
    <FiberCanvas
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
    </FiberCanvas>
  );
}
