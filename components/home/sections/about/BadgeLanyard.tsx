"use client";

import * as THREE from "three";
import { useEffect, useRef, useState } from "react";
import { useFrame, extend } from "@react-three/fiber";
import { useGLTF, useTexture, Text, Decal } from "@react-three/drei";
import {
  BallCollider,
  CuboidCollider,
  RigidBody,
  useRopeJoint,
  useSphericalJoint,
  RapierRigidBody,
} from "@react-three/rapier";
import { MeshLineGeometry, MeshLineMaterial } from "meshline";

extend({ MeshLineGeometry, MeshLineMaterial });

declare module "@react-three/fiber" {
  interface ThreeElements {
    meshLineGeometry: any;
    meshLineMaterial: any;
  }
}

const ballArgs = [0.1] as [number];
const cuboidArgs = [0.8, 1.125, 0.01] as [number, number, number];

const segmentProps = {
  type: "dynamic",
  canSleep: true,
  colliders: false,
  angularDamping: 2,
  linearDamping: 2,
} as const;

export default function BadgeLanyard({ maxSpeed = 50, minSpeed = 10 }) {
  const band = useRef<THREE.Mesh<MeshLineGeometry, MeshLineMaterial>>(null);
  const fixed = useRef<RapierRigidBody>(null!);
  const j1 = useRef<RapierRigidBody>(null!);
  const j2 = useRef<RapierRigidBody>(null!);
  const j3 = useRef<RapierRigidBody>(null!);

  const card = useRef<RapierRigidBody>(null!);
  const vec = new THREE.Vector3();
  const ang = new THREE.Vector3();
  const rot = new THREE.Vector3();
  const dir = new THREE.Vector3();
  const [dragged, drag] = useState<THREE.Vector3 | false>(false);
  const [hovered, hover] = useState(false);

  const { nodes, materials } = useGLTF("/assets/3d/card.glb") as any;
  const texture = useTexture("/assets/images/tag_texture.png");
  const profileTexture = useTexture("/mukagw.JPG");
  profileTexture.colorSpace = THREE.SRGBColorSpace;

  const [curve] = useState(
    () =>
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(),
        new THREE.Vector3(),
        new THREE.Vector3(),
        new THREE.Vector3(),
      ])
  );

  useRopeJoint(fixed, j1, [[0, 0, 0], [0, 0, 0], 1.5]);
  useRopeJoint(j1, j2, [[0, 0, 0], [0, 0, 0], 1.5]);
  useRopeJoint(j2, j3, [[0, 0, 0], [0, 0, 0], 1.5]);

  useSphericalJoint(j3, card, [
    [0, 0, 0],
    [0, 1.45, 0],
  ]);

  useFrame((state, delta) => {
    if (
      !fixed.current ||
      !j1.current ||
      !j2.current ||
      !j3.current ||
      !band.current ||
      !card.current
    )
      return;

    if (fixed.current) {
      const [j1Lerped, j2Lerped] = [j1, j2].map((ref) => {
        if (ref.current) {
          const lerped = new THREE.Vector3().copy(ref.current.translation());

          const clampedDistance = Math.max(
            0.1,
            Math.min(1, lerped.distanceTo(ref.current.translation()))
          );

          return lerped.lerp(
            ref.current.translation(),
            delta * (minSpeed + clampedDistance * (maxSpeed - minSpeed))
          );
        }
      });

      curve.points[0].copy(j3.current.translation());
      curve.points[1].copy(j2Lerped ?? j2.current.translation());
      curve.points[2].copy(j1Lerped ?? j1.current.translation());
      curve.points[3].copy(fixed.current.translation());
      band.current.geometry.setPoints(curve.getPoints(32));

      ang.copy(card.current.angvel());
      rot.copy(card.current.rotation());
      card.current.setAngvel(
        { x: ang.x, y: ang.y - rot.y * 0.25, z: ang.z },
        false
      );

    }
  });

  curve.curveType = "chordal";
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

  return (
    <>
      <group position={[0, 4.6, 0]}>
        <RigidBody ref={fixed} {...segmentProps} type="fixed" />
        <RigidBody position={[1.5, 0, 0]} ref={j1} {...segmentProps}>
          <BallCollider args={ballArgs} />
        </RigidBody>
        <RigidBody position={[3.0, 0, 0]} ref={j2} {...segmentProps}>
          <BallCollider args={ballArgs} />
        </RigidBody>
        <RigidBody position={[4.5, 0, 0]} ref={j3} {...segmentProps}>
          <BallCollider args={ballArgs} />
        </RigidBody>

        <RigidBody
          position={[4.5, -1.45, 0]}
          ref={card}
          {...segmentProps}
        >
          <CuboidCollider args={cuboidArgs} />
          <group
            scale={2.25}
            position={[0, -1.25, -0.05]}
          >
            <mesh geometry={nodes.card.geometry}>
              <meshPhysicalMaterial
                color="#111111"
                clearcoat={1}
                clearcoatRoughness={0.15}
                roughness={0.3}
                metalness={0.5}
              />
              <Decal
                position={[0, 0.52, 0.1]}
                rotation={[0, 0, 0]}
                scale={[0.8, 1.125, 1]}
              >
                <meshPhysicalMaterial
                  map={profileTexture}
                  polygonOffset
                  polygonOffsetFactor={-1}
                  clearcoat={1}
                  clearcoatRoughness={0.15}
                  roughness={0.3}
                  metalness={0.5}
                />
              </Decal>
            </mesh>
            <mesh
              geometry={nodes.clip.geometry}
              material={materials.metal}
              material-roughness={0.3}
            />
            <mesh geometry={nodes.clamp.geometry} material={materials.metal} />
          </group>
        </RigidBody>
      </group>
      <mesh ref={band}>
        <meshLineGeometry />
        <meshLineMaterial
          color="white"
          depthTest={false}
          resolution={new THREE.Vector2(2, 1)}
          useMap={1}
          map={texture}
          repeat={new THREE.Vector2(-3, 1)}
          lineWidth={1}
        />
      </mesh>
    </>
  );
}
