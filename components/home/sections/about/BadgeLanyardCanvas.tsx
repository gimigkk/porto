"use client";

import { Canvas } from "@react-three/fiber";
import {
  Environment,
  Lightformer,
} from "@react-three/drei";
import { Physics } from "@react-three/rapier";
import { useTexture } from "@react-three/drei";
import BadgeLanyard from "./BadgeLanyard";

useTexture.preload("/mukagw.JPG");

export default function BadgeLanyardCanvas({ trigger = true }: { trigger?: boolean }) {
  return (
    <div className="absolute -inset-20 bg-transparent overflow-visible pointer-events-none">
      <Canvas
        camera={{ position: [0, 0, 16], fov: 30 }}
        style={{ backgroundColor: "transparent" }}
        dpr={[1, 1.5]}
        gl={{ powerPreference: "high-performance" }}
      >
        <ambientLight intensity={Math.PI} />
        <Physics
          debug={false}
          interpolate
          gravity={[0, -40, 0]}
          timeStep={1 / 60}
          paused={!trigger}
        >
          <BadgeLanyard />
        </Physics>
        <Environment blur={0.75}>
          <Lightformer
            intensity={2}
            color="white"
            position={[0, -1, 5]}
            rotation={[0, 0, Math.PI / 3]}
            scale={[100, 0.1, 1]}
          />
          <Lightformer
            intensity={3}
            color="white"
            position={[-1, -1, 1]}
            rotation={[0, 0, Math.PI / 3]}
            scale={[100, 0.1, 1]}
          />
          <Lightformer
            intensity={3}
            color="white"
            position={[1, 1, 1]}
            rotation={[0, 0, Math.PI / 3]}
            scale={[100, 0.1, 1]}
          />
          <Lightformer
            intensity={10}
            color="white"
            position={[-10, 0, 14]}
            rotation={[0, Math.PI / 2, Math.PI / 3]}
            scale={[100, 10, 1]}
          />
        </Environment>
      </Canvas>
    </div>
  );
}
