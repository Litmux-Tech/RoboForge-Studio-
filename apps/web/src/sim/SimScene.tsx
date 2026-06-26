import { Canvas, useFrame } from '@react-three/fiber';
import { Grid, OrbitControls } from '@react-three/drei';
import { useRef } from 'react';
import type { Group, Mesh, MeshBasicMaterial } from 'three';
import type { RobotProfile } from '@roboforge/core';
import type { SimTransport } from '@roboforge/sim';

const STOP_CM = 25;

function Car({ profile, sim }: { profile: RobotProfile; sim: SimTransport }) {
  const ref = useRef<Group>(null);
  const beam = useRef<Mesh>(null);
  const wr = profile.drive.wheelRadius ?? 0.033;
  const wb = profile.drive.wheelBase ?? 0.16;
  const tw = profile.drive.trackWidth ?? 0.15;
  const nose = wb * 0.85;

  useFrame(() => {
    if (ref.current) {
      ref.current.position.x = sim.pose.x;
      ref.current.position.z = sim.pose.z;
      ref.current.rotation.y = sim.pose.yaw;
    }
    if (beam.current) {
      const d = Math.min(sim.frontDistanceM, 2);
      beam.current.scale.z = Math.max(0.001, d);
      beam.current.position.z = nose + d / 2;
      const mat = beam.current.material as MeshBasicMaterial;
      const close = sim.frontDistanceM * 100 < STOP_CM;
      mat.color.set(close ? '#f43f5e' : '#22d3ee');
      mat.opacity = close ? 0.85 : 0.35;
    }
  });

  return (
    <group ref={ref}>
      {/* chassis */}
      <mesh position={[0, wr + 0.025, 0]} castShadow>
        <boxGeometry args={[tw, 0.05, wb * 1.7]} />
        <meshStandardMaterial color="#1f2937" metalness={0.45} roughness={0.5} />
      </mesh>
      {/* ESP32 board */}
      <mesh position={[0, wr + 0.058, -wb * 0.1]} castShadow>
        <boxGeometry args={[tw * 0.5, 0.012, wb * 0.55]} />
        <meshStandardMaterial color="#0e7490" emissive="#06b6d4" emissiveIntensity={0.15} />
      </mesh>
      {/* wheels (from the profile's motor mounts) */}
      {profile.drive.motors.map((m) => (
        <mesh
          key={m.id}
          position={[m.mount?.y ?? 0, wr, m.mount?.x ?? 0]}
          rotation={[0, 0, Math.PI / 2]}
          castShadow
        >
          <cylinderGeometry args={[wr, wr, 0.03, 20]} />
          <meshStandardMaterial color="#0b1220" roughness={0.85} />
        </mesh>
      ))}
      {/* ultrasonic "eyes" */}
      {[-0.028, 0.028].map((x) => (
        <mesh key={x} position={[x, wr + 0.03, nose]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.016, 0.016, 0.018, 16]} />
          <meshStandardMaterial color="#155e75" metalness={0.6} />
        </mesh>
      ))}
      {/* ultrasonic beam (length = measured distance) */}
      <mesh ref={beam} position={[0, wr + 0.03, nose]}>
        <boxGeometry args={[0.008, 0.008, 1]} />
        <meshBasicMaterial color="#22d3ee" transparent opacity={0.35} />
      </mesh>
    </group>
  );
}

function Obstacles({ sim }: { sim: SimTransport }) {
  return (
    <>
      {sim.obstacles.map((o, i) => (
        <mesh key={i} position={[o.x, 0.12, o.z]} castShadow>
          <coneGeometry args={[o.r, 0.24, 18]} />
          <meshStandardMaterial color="#f59e0b" roughness={0.6} />
        </mesh>
      ))}
    </>
  );
}

export function SimScene({ profile, sim }: { profile: RobotProfile; sim: SimTransport | null }) {
  return (
    <Canvas shadows dpr={[1, 2]} camera={{ position: [2.4, 1.9, 2.8], fov: 50 }}>
      <color attach="background" args={['#0a0f1a']} />
      <fog attach="fog" args={['#0a0f1a', 6, 14]} />
      <hemisphereLight args={['#bcd4ff', '#0a0f1a', 0.5]} />
      <directionalLight
        position={[3, 6, 2]}
        intensity={1.3}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-left={-4}
        shadow-camera-right={4}
        shadow-camera-top={4}
        shadow-camera-bottom={-4}
      />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0, 0]}>
        <planeGeometry args={[30, 30]} />
        <shadowMaterial transparent opacity={0.35} />
      </mesh>
      <Grid
        args={[20, 20]}
        cellSize={0.5}
        cellThickness={0.6}
        cellColor="#1e293b"
        sectionSize={2.5}
        sectionThickness={1}
        sectionColor="#334155"
        infiniteGrid
        fadeDistance={16}
        fadeStrength={1.5}
      />
      {sim && <Car profile={profile} sim={sim} />}
      {sim && <Obstacles sim={sim} />}
      <OrbitControls
        enablePan={false}
        minDistance={1.6}
        maxDistance={7}
        maxPolarAngle={Math.PI / 2.15}
        target={[0, 0.1, 0]}
      />
    </Canvas>
  );
}
