import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Grid, OrbitControls, ContactShadows, MeshReflectorMaterial } from '@react-three/drei';
import { useRef } from 'react';
import { Vector3 } from 'three';
import type { Group, Mesh, MeshBasicMaterial } from 'three';
import type { RobotProfile } from '@roboforge/core';
import type { SimTransport } from '@roboforge/sim';

const STOP_CM = 25;
const _target = new Vector3();

type Controls = { target: Vector3; update: () => void } | null;

function Car({ profile, sim }: { profile: RobotProfile; sim: SimTransport }) {
  const ref = useRef<Group>(null);
  const beam = useRef<Mesh>(null);
  const controls = useThree((s) => s.controls) as unknown as Controls;

  const wr = Math.max(profile.drive.wheelRadius ?? 0.033, 0.052);
  const wb = profile.drive.wheelBase ?? 0.16;
  const tw = profile.drive.trackWidth ?? 0.15;
  const nose = wb * 0.95;

  useFrame(() => {
    if (ref.current) {
      ref.current.position.x = sim.pose.x;
      ref.current.position.z = sim.pose.z;
      ref.current.rotation.y = sim.pose.yaw;
    }
    if (beam.current) {
      const d = Math.min(sim.frontDistanceM, 1.5);
      beam.current.scale.z = Math.max(0.001, d);
      beam.current.position.z = nose + d / 2;
      const mat = beam.current.material as MeshBasicMaterial;
      const close = sim.frontDistanceM * 100 < STOP_CM;
      mat.color.set(close ? '#f43f5e' : '#22d3ee');
      mat.opacity = close ? 0.9 : 0.4;
    }
    // glide the camera target onto the car so it stays centred and large
    if (controls?.target) {
      _target.set(sim.pose.x, wr, sim.pose.z);
      controls.target.lerp(_target, 0.08);
      controls.update();
    }
  });

  return (
    <group ref={ref}>
      {/* lower chassis plate */}
      <mesh position={[0, wr, 0]} castShadow receiveShadow>
        <boxGeometry args={[tw * 1.05, 0.03, wb * 2.0]} />
        <meshStandardMaterial color="#111827" metalness={0.6} roughness={0.5} />
      </mesh>
      {/* navy body shell */}
      <mesh position={[0, wr + 0.05, -wb * 0.05]} castShadow>
        <boxGeometry args={[tw * 0.95, 0.07, wb * 1.5]} />
        <meshStandardMaterial color="#1d4ed8" metalness={0.4} roughness={0.45} />
      </mesh>
      {/* top deck */}
      <mesh position={[0, wr + 0.092, -wb * 0.05]} castShadow>
        <boxGeometry args={[tw * 0.8, 0.014, wb * 1.2]} />
        <meshStandardMaterial color="#0b1220" metalness={0.5} roughness={0.4} />
      </mesh>
      {/* ESP32 board */}
      <mesh position={[0, wr + 0.106, -wb * 0.15]} castShadow>
        <boxGeometry args={[tw * 0.42, 0.01, wb * 0.5]} />
        <meshStandardMaterial color="#0e7490" emissive="#06b6d4" emissiveIntensity={0.35} />
      </mesh>
      {/* antenna */}
      <mesh position={[tw * 0.3, wr + 0.17, -wb * 0.4]}>
        <cylinderGeometry args={[0.004, 0.004, 0.14, 8]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
      <mesh position={[tw * 0.3, wr + 0.245, -wb * 0.4]}>
        <sphereGeometry args={[0.012, 12, 12]} />
        <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={0.6} />
      </mesh>
      {/* wheels + metal hubs (from the profile's motor mounts) */}
      {profile.drive.motors.map((m) => (
        <group key={m.id} position={[m.mount?.y ?? 0, wr, m.mount?.x ?? 0]}>
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[wr, wr, 0.055, 24]} />
            <meshStandardMaterial color="#0a0e17" roughness={0.95} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[wr * 0.45, wr * 0.45, 0.06, 16]} />
            <meshStandardMaterial color="#64748b" metalness={0.85} roughness={0.3} />
          </mesh>
        </group>
      ))}
      {/* ultrasonic module + eyes */}
      <mesh position={[0, wr + 0.05, nose]} castShadow>
        <boxGeometry args={[tw * 0.5, 0.032, 0.012]} />
        <meshStandardMaterial color="#0b1220" />
      </mesh>
      {[-0.03, 0.03].map((x) => (
        <mesh key={x} position={[x, wr + 0.05, nose + 0.007]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.018, 0.018, 0.012, 18]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.7} roughness={0.3} />
        </mesh>
      ))}
      {/* ultrasonic beam (length = measured distance) */}
      <mesh ref={beam} position={[0, wr + 0.05, nose]}>
        <boxGeometry args={[0.01, 0.01, 1]} />
        <meshBasicMaterial color="#22d3ee" transparent opacity={0.4} />
      </mesh>
    </group>
  );
}

function Obstacles({ sim }: { sim: SimTransport }) {
  return (
    <>
      {sim.obstacles.map((o, i) => (
        <mesh key={i} position={[o.x, 0.14, o.z]} castShadow>
          <coneGeometry args={[o.r, 0.28, 20]} />
          <meshStandardMaterial color="#f59e0b" roughness={0.5} />
        </mesh>
      ))}
    </>
  );
}

function Props() {
  const crates: [number, number, number, number][] = [
    [1.35, 0.12, -1.2, 0.24],
    [-1.45, 0.1, -1.0, 0.2],
    [1.4, 0.14, 1.15, 0.28],
  ];
  return (
    <group>
      {crates.map(([x, y, z, s], i) => (
        <mesh key={i} position={[x, y, z]} rotation={[0, i * 0.7, 0]} castShadow receiveShadow>
          <boxGeometry args={[s, s * 0.9, s]} />
          <meshStandardMaterial color="#5b4636" roughness={0.85} />
        </mesh>
      ))}
      <mesh position={[-1.5, 0.16, 1.3]} castShadow>
        <cylinderGeometry args={[0.13, 0.13, 0.32, 20]} />
        <meshStandardMaterial color="#1f6f54" metalness={0.3} roughness={0.6} />
      </mesh>
    </group>
  );
}

export function SimScene({ profile, sim }: { profile: RobotProfile; sim: SimTransport | null }) {
  return (
    <Canvas shadows dpr={[1, 2]} camera={{ position: [1.2, 0.85, 1.5], fov: 50 }}>
      <color attach="background" args={['#080b12']} />
      <fog attach="fog" args={['#080b12', 4, 11]} />
      <hemisphereLight args={['#cfe0ff', '#0a0f1a', 0.6]} />
      <directionalLight
        position={[3, 5, 2]}
        intensity={1.4}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-left={-3}
        shadow-camera-right={3}
        shadow-camera-top={3}
        shadow-camera-bottom={-3}
      />
      <pointLight position={[-2, 1.5, -2]} intensity={8} color="#22d3ee" distance={6} />
      <pointLight position={[2.5, 1.2, 2]} intensity={5} color="#f59e0b" distance={7} />

      {/* reflective floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <MeshReflectorMaterial
          resolution={512}
          blur={[300, 100]}
          mixBlur={1}
          mixStrength={25}
          roughness={0.85}
          depthScale={1.1}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.3}
          color="#0a0f1a"
          metalness={0.6}
          mirror={0.5}
        />
      </mesh>
      <Grid
        args={[20, 20]}
        cellSize={0.4}
        cellThickness={0.5}
        cellColor="#1e293b"
        sectionSize={2}
        sectionThickness={1}
        sectionColor="#334155"
        infiniteGrid
        fadeDistance={14}
        fadeStrength={1.5}
        position={[0, 0.001, 0]}
      />
      <ContactShadows position={[0, 0.002, 0]} opacity={0.55} scale={8} blur={2.5} far={3} color="#000000" />

      {sim && <Car profile={profile} sim={sim} />}
      {sim && <Obstacles sim={sim} />}
      <Props />

      <OrbitControls
        makeDefault
        enablePan={false}
        enableDamping
        dampingFactor={0.1}
        minDistance={0.9}
        maxDistance={4}
        maxPolarAngle={Math.PI / 2.1}
      />
    </Canvas>
  );
}
