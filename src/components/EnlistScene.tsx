import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import * as TWEEN from "@tweenjs/tween.js";
import { UnitBlueprint } from "@/units/UnitBlueprint";
import { useModelStore } from "./ModelStore";
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils.js";
import { Unit } from "@/units/Unit";

interface EnlistSceneProps {
  enemies: Unit[];
  onProceed: () => void;
}

const EnlistScene: React.FC<EnlistSceneProps> = ({ enemies, onProceed }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [targetRotation, setTargetRotation] = useState(0);
  const visualRotation = useRef({ angle: 0 });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const unitCount = enemies.length;

  let radius = 0;
  if (unitCount > 1) {
    const unitSpacing = 4;
    const circumference = unitCount * unitSpacing;
    radius = circumference / (2 * Math.PI);
  }

  const handleRotateLeft = () => {
    if (unitCount > 1) {
      setTargetRotation((prevAngle) => prevAngle - (Math.PI * 2) / unitCount);
      setSelectedIndex((prevIndex) => (prevIndex + 1) % unitCount);
    }
  };

  const handleRotateRight = () => {
    if (unitCount > 1) {
      setTargetRotation((prevAngle) => prevAngle + (Math.PI * 2) / unitCount);
      setSelectedIndex((prevIndex) => (prevIndex - 1 + unitCount) % unitCount);
    }
  };

  const selectedUnit = enemies[selectedIndex];

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
    camera.position.set(radius + 5, 3, 0);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(
      currentContainer.clientWidth,
      currentContainer.clientHeight
    );
    currentContainer.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 15, 10);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    const models: { model: THREE.Object3D; mixer: THREE.AnimationMixer }[] = [];

    enemies.forEach((unit) => {
      const modelData =
        useModelStore.getState().models[unit.blueprint.modelKey];
      if (modelData && modelData.gltf) {
        const model = SkeletonUtils.clone(modelData.gltf);
        const mixer = new THREE.AnimationMixer(model);

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

      models.forEach(({ model, mixer }, i) => {
        const angle =
          (i / unitCount) * Math.PI * 2 + visualRotation.current.angle;
        const xPos = Math.cos(angle) * radius;
        const zPos = Math.sin(angle) * radius;
        model.position.set(xPos, 0, zPos);

        if (unitCount === 1) {
          model.lookAt(camera.position.x, 0, camera.position.z);
        } else {
          model.lookAt(xPos * 2, 0, zPos * 2);
        }

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
    };
  }, [enemies, radius, unitCount]);

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
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 100,
      }}
    >
      <div
        style={{
          width: "85vw",
          height: "85vh",
          backgroundColor: "#1a202c",
          border: "2px solid #4a5568",
          borderRadius: "10px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div
          ref={containerRef}
          style={{ flex: 1, overflow: "hidden", backgroundColor: "#111" }}
        />
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "#1a202c",
            padding: "20px",
            boxSizing: "border-box",
            color: "white",
          }}
        >
          <button
            style={buttonStyle}
            onClick={handleRotateLeft}
            disabled={unitCount <= 1}
          >
            &lt;
          </button>

          <div style={{ textAlign: "center", minWidth: "200px" }}>
            {selectedUnit && (
              <>
                <h3 style={{ margin: 0, fontSize: "24px" }}>
                  {selectedUnit.blueprint.name}
                </h3>
                <p style={{ margin: "5px 0 0 0", fontSize: "18px" }}>
                  Health: {selectedUnit.healthComponent.maxHealth}
                </p>
              </>
            )}
          </div>

          <button
            style={buttonStyle}
            onClick={handleRotateRight}
            disabled={unitCount <= 1}
          >
            &gt;
          </button>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            paddingBottom: "20px",
          }}
        >
          <button
            style={{
              background: "#2c5282",
              color: "white",
              border: "none",
              borderRadius: "8px",
              padding: "15px 30px",
              fontSize: "20px",
              cursor: "pointer",
            }}
            onClick={onProceed}
          >
            Proceed to Shop
          </button>
        </div>
      </div>
    </div>
  );
};

export default EnlistScene;
