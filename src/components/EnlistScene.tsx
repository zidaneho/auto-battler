import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import * as TWEEN from "@tweenjs/tween.js";
import { UnitBlueprint } from "@/units/UnitBlueprint";
import { useModelStore } from "./ModelStore";
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils.js";
import { Unit } from "@/units/Unit";
import {
  GridTile,
  UnitPlacementSystemHandle,
} from "@/units/UnitPlacementSystem";
import { UnitStats } from "@/units/UnitStats";

interface EnlistSceneProps {
  enemies: Unit[];
  placementRef: React.RefObject<UnitPlacementSystemHandle | null>;
  onProceed: () => void;
  onEnlist: (unit: Unit, avaliableTile: GridTile) => void;
}

const EnlistScene: React.FC<EnlistSceneProps> = ({
  enemies,
  placementRef,
  onProceed,
  onEnlist,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const unitGroupRef = useRef<THREE.Group>(new THREE.Group());

  const unitCount = enemies.length;
  const unitSpacing = 5;

  const handleNextUnit = () => {
    if (unitCount > 1) {
      setSelectedIndex((prevIndex) => (prevIndex + 1) % unitCount);
    }
  };

  const handlePrevUnit = () => {
    if (unitCount > 1) {
      setSelectedIndex((prevIndex) => (prevIndex - 1 + unitCount) % unitCount);
    }
  };

  const selectedUnit = enemies[selectedIndex];

  // --- REVISED STATS DISPLAY LOGIC ---
  // This array explicitly defines which stats to display and in what order.
  const statsToDisplay: { key: keyof UnitStats; label: string }[] = [
    { key: "maxHealth", label: "Max Health" },
    { key: "baseAttack", label: "Attack" },
    { key: "baseArmor", label: "Armor" },
    { key: "baseMagArmor", label: "Magical Armor" },
    { key: "baseAttackSpeed", label: "Attack Speed" },
    { key: "baseAttackRange", label: "Attack Range" },
    { key: "baseCritChance", label: "Critical Chance" },
    { key: "baseMoveSpeed", label: "Move Speed" },
    { key: "baseMagAttack", label: "Magic Attack" },
    { key: "baseEvasion", label: "Evasion" },
    { key: "level", label: "Level" },
  ];

  useEffect(() => {
    if (!containerRef.current || unitCount === 0) return;
    const currentContainer = containerRef.current;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a202c);

    const aspect = currentContainer.clientWidth / currentContainer.clientHeight;
    const viewSize = 8;
    const camera = new THREE.OrthographicCamera(
      (-aspect * viewSize) / 2,
      (aspect * viewSize) / 2,
      viewSize / 2,
      -viewSize / 2,
      0.1,
      1000
    );
    camera.position.set(0, 1.5, 10);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(
      currentContainer.clientWidth,
      currentContainer.clientHeight
    );
    currentContainer.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
    directionalLight.position.set(5, 15, 10);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    while (unitGroupRef.current.children.length > 0) {
      unitGroupRef.current.remove(unitGroupRef.current.children[0]);
    }

    const models: { model: THREE.Object3D; mixer: THREE.AnimationMixer }[] = [];
    const totalWidth = (unitCount - 1) * unitSpacing;
    const startX = -totalWidth / 2;

    enemies.forEach((unit, i) => {
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

        model.scale.set(2.5, 2.5, 2.5);
        const xPos = startX + i * unitSpacing;
        model.position.set(xPos, -2, 0);
        model.lookAt(0, -2, 10);

        unitGroupRef.current.add(model);
        models.push({ model, mixer });
      }
    });

    scene.add(unitGroupRef.current);

    const clock = new THREE.Clock();
    const animate = () => {
      requestAnimationFrame(animate);
      const delta = clock.getDelta();
      TWEEN.update();
      models.forEach(({ mixer }) => mixer.update(delta));
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!currentContainer) return;
      const { clientWidth, clientHeight } = currentContainer;

      const newAspect = clientWidth / clientHeight;
      camera.left = (-newAspect * viewSize) / 2;
      camera.right = (newAspect * viewSize) / 2;
      camera.top = viewSize / 2;
      camera.bottom = -viewSize / 2;
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
  }, [enemies, unitCount]);

  useEffect(() => {
    const totalWidth = (unitCount - 1) * unitSpacing;
    const startX = -totalWidth / 2;
    const selectedUnitX = startX + selectedIndex * unitSpacing;
    const targetX = -selectedUnitX;

    new TWEEN.Tween(unitGroupRef.current.position)
      .to({ x: targetX }, 500)
      .easing(TWEEN.Easing.Quadratic.Out)
      .start();
  }, [selectedIndex, unitCount, unitSpacing]);

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
          width: "85%",
          height: "85%",
          backgroundColor: "#1a202c",
          border: "2px solid #4a5568",
          borderRadius: "10px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          padding: "20px",
        }}
      >
        <div
          ref={containerRef}
          style={{
            height: "50%",
            overflow: "hidden",
            backgroundColor: "#1a202c",
            borderRadius: "8px",
          }}
        />

        <div
          style={{
            flexGrow: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-around",
            paddingTop: "10px",
          }}
        >
          {/* Unit Name and Controls */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              color: "white",
            }}
          >
            <button
              style={{
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
              }}
              onClick={handlePrevUnit}
              disabled={unitCount <= 1}
            >
              &lt;
            </button>
            <div style={{ textAlign: "center", minWidth: "250px" }}>
              {selectedUnit && (
                <h3 style={{ margin: 0, fontSize: "28px" }}>
                  {selectedUnit.blueprint.name}
                </h3>
              )}
            </div>
            <button
              style={{
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
              }}
              onClick={handleNextUnit}
              disabled={unitCount <= 1}
            >
              &gt;
            </button>
          </div>

          {/* Stats Box */}
          <div
            style={{
              backgroundColor: "rgba(0,0,0,0.2)",
              padding: "15px",
              border: "1px solid #4a5568",
              borderRadius: "10px",
              alignSelf: "center",
              color: "white",
              width: "80%",
              textAlign: "center",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "10px",
                justifyContent: "center",
              }}
            >
              {selectedUnit &&
                statsToDisplay.map(({ key, label }) => {
                  const value = selectedUnit.stats[key];

                  return (
                    <p
                      key={key}
                      style={{ margin: 0, fontSize: "16px", textAlign: "left" }}
                    >
                      <span style={{ fontWeight: "bold" }}>{label}: </span>
                      {String(value)}
                    </p>
                  );  
                })}
            </div>
          </div>

          {/* Action Buttons */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <button
              style={{
                background: "#4CAF50",
                color: "white",
                border: "none",
                borderRadius: "8px",
                padding: "15px 30px",
                fontSize: "20px",
                cursor: "pointer",
              }}
              onClick={() => {
                if (!placementRef.current || !selectedUnit) return;
                let freeTile: GridTile | null = null;
                const gridPositions = placementRef.current.getGridTiles();
                for (let i = 0; i < gridPositions.length / 2; i++) {
                  for (const tile of gridPositions[i]) {
                    if (tile.occupiedUnit == null) {
                      freeTile = tile;
                      break;
                    }
                  }
                  if (freeTile) break;
                }
                if (freeTile) {
                  onEnlist(selectedUnit, freeTile);
                  onProceed();
                } else {
                  console.warn("No free space for the unit!");
                }
              }}
            >
              Enlist Unit
            </button>
            <button
              style={{
                background: "#c53030",
                color: "white",
                border: "none",
                borderRadius: "8px",
                padding: "15px 30px",
                fontSize: "20px",
                cursor: "pointer",
              }}
              onClick={onProceed}
            >
              Skip
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnlistScene;
