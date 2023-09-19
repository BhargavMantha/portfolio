import { useState, useRef, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial, Preload } from "@react-three/drei";

const generateRandomSpherePoints = (numPoints, radius) => {
  const positions = new Float32Array(numPoints * 3); // x, y, z for each point

  for (let i = 0; i < numPoints; i++) {
      const theta = 2 * Math.PI * Math.random(); // Random value between [0, 2PI]
      const phi = Math.acos(2 * Math.random() - 1); // Random value between [0, PI]

      const x = Math.sin(phi) * Math.cos(theta);
      const y = Math.sin(phi) * Math.sin(theta);
      const z = Math.cos(phi);

      // Scale by random radius to ensure point lies inside sphere
      const r = radius * Math.cbrt(Math.random()); // Cube root ensures even distribution in 3D space
      positions[i * 3] = x * r;
      positions[i * 3 + 1] = y * r;
      positions[i * 3 + 2] = z * r;
  }

  return positions;
}

const Stars = (props) => {
  const ref = useRef();
  const [sphere] = useState(() => generateRandomSpherePoints(500, 1.2));

  useFrame((state, delta) => {
    ref.current.rotation.x -= delta / 10;
    ref.current.rotation.y -= delta / 15;
  });

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={sphere} stride={3} frustumCulled {...props}>
        <PointMaterial
          transparent
          color='#f272c8'
          size={0.002}
          sizeAttenuation={true}
          depthWrite={false}
        />
      </Points>
    </group>
  );
};

const StarsCanvas = () => {
  return (
    <div className='w-full h-auto absolute inset-0 z-[-1]'>
       <Canvas
      frameloop='demand'
      dpr={[1, 2]}
      gl={{ preserveDrawingBuffer: true }}
      camera={{
        position: [1, 0,0],
      }}
    >

          <Stars />

        <Preload all />
      </Canvas>
    </div>
  );
};

export default StarsCanvas;