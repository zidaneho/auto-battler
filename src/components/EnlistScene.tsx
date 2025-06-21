import React, { useEffect, useRef } from "react";
import * as THREE from "three";

const EnlistScene: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const currentContainer = containerRef.current;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a202c);

    const camera = new THREE.PerspectiveCamera(
      75,
      currentContainer.clientWidth / currentContainer.clientHeight,
      0.1,
      1000
    );
    const unitCount = 16;
    const radius = 10;
    camera.position.set(0, 3, radius + 5);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(
      currentContainer.clientWidth,
      currentContainer.clientHeight
    );
    currentContainer.appendChild(renderer.domElement);

    // --- Add Cubes ---
    const geometry = new THREE.BoxGeometry(1, 2, 1);
    
    // --- MODIFICATION: Store materials and cubes for cleanup ---
    const materials: THREE.Material[] = [];
    const cubes: THREE.Object3D[] = [];

    for (let i = 0; i < unitCount; i++) {
      // --- MODIFICATION: Create a unique color and material for each cube ---
      const hue = i / unitCount; // Go from 0 to 1 around the color wheel
      const color = new THREE.Color().setHSL(hue, 1.0, 0.5);
      const material = new THREE.MeshBasicMaterial({ color: color });
      materials.push(material); // Store material for cleanup

      const cube = new THREE.Mesh(geometry, material);
      const angle = (i / unitCount) * Math.PI * 2;
      const xPos = Math.cos(angle) * radius;
      const zPos = Math.sin(angle) * radius;
      cube.position.set(xPos, 0, zPos);
      scene.add(cube);
      cubes.push(cube);
    }

    const animate = () => {
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
      if (!currentContainer) return;
      const clientWidth = currentContainer.clientWidth;
      const clientHeight = currentContainer.clientHeight;
      camera.aspect = clientWidth / clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(clientWidth, clientHeight);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (currentContainer && renderer.domElement) {
        currentContainer.removeChild(renderer.domElement);
      }
      renderer.dispose();
      geometry.dispose();
      // --- MODIFICATION: Dispose of all created materials ---
      for (const material of materials) {
        material.dispose();
      }
    };
  }, []);

  // The component's JSX remains the same
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100vw",
        height: "100vh",
        backgroundColor: "#111",
      }}
    >
      <div ref={containerRef} style={{ flex: 1, overflow: "hidden" }} />
      <div
        style={{
          flex: 1,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#1a202c",
          padding: "20px",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            border: "2px solid #4a5568",
            borderRadius: "8px",
            padding: "20px",
            color: "white",
            textAlign: "center",
          }}
        >
          <h3>Unit Details</h3>
          <p>Example text for the selected unit.</p>
        </div>
        
        
      </div>
    </div>
  );
};

export default EnlistScene;