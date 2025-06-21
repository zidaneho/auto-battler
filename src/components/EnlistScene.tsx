import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import * as TWEEN from "@tweenjs/tween.js";
import { UnitBlueprint } from "@/units/UnitBlueprint";
import { useModelStore } from "./ModelStore";
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils.js";

interface EnlistSceneProps {
  enemies: UnitBlueprint[];
}

const EnlistScene: React.FC<EnlistSceneProps> = ({ enemies }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [targetRotation, setTargetRotation] = useState(0);
  const visualRotation = useRef({ angle: 0 });

  // Use the length of the incoming enemies array
  const unitCount = enemies.length;
  const radius = unitCount > 1 ? 10 : 0; // Adjust radius for single unit case

  const handleRotateLeft = () => {
    if (unitCount > 1) {
      setTargetRotation((prevAngle) => prevAngle - (Math.PI * 2) / unitCount);
    }
  };

  const handleRotateRight = () => {
    if (unitCount > 1) {
      setTargetRotation((prevAngle) => prevAngle + (Math.PI * 2) / unitCount);
    }
  };

  useEffect(() => {
    if (!containerRef.current || unitCount === 0) return;
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

    // Array to hold the unit models and their animation mixers
    const models: { model: THREE.Object3D; mixer: THREE.AnimationMixer }[] = [];

    // Loop through the enemies and create a 3D model for each
    enemies.forEach((blueprint) => {
      const modelData = useModelStore.getState().models[blueprint.modelKey];
      if (modelData && modelData.gltf) {
        const model = SkeletonUtils.clone(modelData.gltf);
        const mixer = new THREE.AnimationMixer(model);

        // Find and play the idle animation
        const idleClip = Object.values(modelData.animations).find(
          (clip) =>
            clip.name.toLowerCase().includes("idle") ||
            clip.name.toLowerCase().includes("idle_a")
        );
        if (idleClip) {
          mixer.clipAction(idleClip).play();
        }

        scene.add(model);
        models.push({ model, mixer });
      }
    });

    const clock = new THREE.Clock();
    const animate = () => {
      const delta = clock.getDelta();
      TWEEN.update();

      // Animate each model
      models.forEach(({ model, mixer }, i) => {
        const angle =
          (i / unitCount) * Math.PI * 2 + visualRotation.current.angle;
        const xPos = Math.cos(angle) * radius;
        const zPos = Math.sin(angle) * radius;
        model.position.set(xPos, 1, zPos);
        model.lookAt(0, 1, 0);

        mixer.update(delta);
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
      // No need to dispose geometry/materials as they are managed by the store
    };
  }, [enemies, radius, unitCount]); // Rerun effect if enemies change

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
      {/* 3D Canvas Container */}
      <div
        ref={containerRef}
        style={{ flex: 1, overflow: "hidden", backgroundColor: "#111" }}
      />

      {/* Unit Details & Rotation UI */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#1a202c",
          padding: "10px",
          boxSizing: "border-box",
        }}
      >
        <button
          style={buttonStyle}
          onClick={handleRotateLeft}
          disabled={unitCount <= 1}
        >
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
        <button
          style={buttonStyle}
          onClick={handleRotateRight}
          disabled={unitCount <= 1}
        >
          &gt;
        </button>
      </div>

      {/* IVs & Summary UI */}
      <div
        style={{
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