import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import * as TWEEN from "@tweenjs/tween.js";

const EnlistScene: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [targetRotation, setTargetRotation] = useState(0);
  const visualRotation = useRef({ angle: 0 });

  const unitCount = 16;
  const radius = 10;

  const handleRotateLeft = () => {
    setTargetRotation((prevAngle) => prevAngle - (Math.PI * 2) / unitCount);
  };

  const handleRotateRight = () => {
    setTargetRotation((prevAngle) => prevAngle + (Math.PI * 2) / unitCount);
  };

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
    camera.position.set(0, 3, radius + 5);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(
      currentContainer.clientWidth,
      currentContainer.clientHeight
    );
    currentContainer.appendChild(renderer.domElement);

    const geometry = new THREE.BoxGeometry(1, 2, 1);
    const materials: THREE.Material[] = [];
    const cubes: THREE.Object3D[] = [];

    for (let i = 0; i < unitCount; i++) {
      const hue = i / unitCount;
      const color = new THREE.Color().setHSL(hue, 1.0, 0.5);
      const material = new THREE.MeshBasicMaterial({ color: color });
      materials.push(material);
      const cube = new THREE.Mesh(geometry, material);
      scene.add(cube);
      cubes.push(cube);
    }

    const animate = () => {
      TWEEN.update();
      cubes.forEach((cube, i) => {
        const angle =
          (i / unitCount) * Math.PI * 2 + visualRotation.current.angle;
        const xPos = Math.cos(angle) * radius;
        const zPos = Math.sin(angle) * radius;
        cube.position.set(xPos, 1, zPos);
        cube.lookAt(0, 1, 0);
      });
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
      if (!currentContainer) return;
      const { clientWidth, clientHeight } = currentContainer;
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
      TWEEN.removeAll();
      renderer.dispose();
      geometry.dispose();
      materials.forEach((m) => m.dispose());
    };
  }, []);

  useEffect(() => {
    new TWEEN.Tween(visualRotation.current)
      .to({ angle: targetRotation }, 500)
      .easing(TWEEN.Easing.Quadratic.Out)
      .start();
  }, [targetRotation]);

  const buttonStyle: React.CSSProperties = {
    background: "#4a5568",
    color: "white",
    border: "none",
    borderRadius: "50%",
    width: "50px",
    height: "50px",
    fontSize: "24px",
    cursor: "pointer",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    margin: "0 20px",
    userSelect: "none",
  };

  return (
    <div className="game-container">
      {/* 3D Canvas Container - This will now take up the remaining space */}
      <div
        ref={containerRef}
        style={{ flex: 1, overflow: "hidden", backgroundColor: "#111" }}
      />

      {/* Unit Details & Rotation UI - Removed flex: 1 */}
      <div
        style={{
          /* flex: 1, */ // <--- REMOVED
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#1a202c",
          padding: "10px",
          boxSizing: "border-box",
        }}
      >
        <button style={buttonStyle} onClick={handleRotateLeft}>
          &lt;
        </button>
        <div
          style={{
            border: "2px solid #4a5568",
            borderRadius: "8px",
            padding: "20px",
            color: "white",
            textAlign: "center",
            minWidth: "250px",
          }}
        >
          <h3>Unit Details</h3>
          <p>Example text for the selected unit.</p>
        </div>
        <button style={buttonStyle} onClick={handleRotateRight}>
          &gt;
        </button>
      </div>

      {/* IVs & Summary UI - Removed flex: 1 */}
      <div
        style={{
          /* flex: 1, */ // <--- REMOVED
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
            display: "flex",
            flexDirection: "row",
            gap: "40px",
          }}
        >
          <div
            style={{
              border: "2px solid #4a5568",
              borderRadius: "8px",
              padding: "20px",
              color: "white",
              textAlign: "center",
              minWidth: "250px",
              minHeight: "250px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <h3>IVs</h3>
            <p>Example text for the selected unit.</p>
          </div>
          <div
            style={{
              border: "2px solid #4a5568",
              borderRadius: "8px",
              padding: "20px",
              color: "white",
              textAlign: "center",
              minWidth: "250px",
              minHeight: "250px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <h3>Summary</h3>
            <p>Example text for the selected unit.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnlistScene;