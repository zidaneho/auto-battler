"use client";

import React, { useState, useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import * as RAPIER from "@dimforge/rapier3d";

import { GameObjectManager } from "./ecs/GameObjectManager";
import { UnitManager } from "./units/UnitManager";
import {
  fillUnitOnGrid,
  UnitPlacementSystem,
  UnitPlacementSystemHandle,
} from "./UnitPlacementSystem";
import { loadGLTFModels } from "./useGLTFModels";
import { useModelStore } from "./ModelStore";
import { models } from "./meshes/ModelList"; // unified list

interface Player {
  id: number;
  gold: number;
  units: any[];
  board: any[];
}

const AutoBattler: React.FC = () => {
  const [players, setPlayers] = useState<Player[]>([
    { id: 1, gold: 100, units: [], board: [] },
    { id: 2, gold: 100, units: [], board: [] },
  ]);
  const [currentRound, setCurrentRound] = useState(1);
  const [roundState, setRoundState] = useState<"setup" | "battle" | "end">(
    "setup"
  );
  const [currentMap, setCurrentMap] =
    useState<keyof typeof models>("prototypeMap");
  const [roundTimer, setRoundTimer] = useState<number>(30);
  const [isGameActive, setIsGameActive] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const worldRef = useRef<RAPIER.World | null>(null);
  const gameObjectManagerRef = useRef<GameObjectManager | null>(null);
  const unitManagerRef = useRef<UnitManager | null>(null);
  const placementRef = useRef<UnitPlacementSystemHandle>(null);
  const placementRef2 = useRef<UnitPlacementSystemHandle>(null);

  const threeRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    controls: OrbitControls;
  } | null>(null);

  useEffect(() => {
    async function loadGLTFModelsAsync(): Promise<void> {
      return new Promise((resolve) => loadGLTFModels(resolve));
    }
    (async () => {
      await loadGLTFModelsAsync();
      setIsLoaded(true);
      console.log("all models loaded!");
    })();
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x202020);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 2, 5);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(
      containerRef.current.clientWidth,
      containerRef.current.clientHeight
    );
    containerRef.current.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);

    threeRef.current = {
      scene,
      camera,
      renderer,
      controls,
    };

    const handleResize = () => {
      if (!containerRef.current || !threeRef.current) return;
      const { camera, renderer } = threeRef.current;
      camera.aspect =
        containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(
        containerRef.current.clientWidth,
        containerRef.current.clientHeight
      );
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      containerRef.current?.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  useEffect(() => {
    if (!worldRef.current) {
      const gravity = { x: 0.0, y: -9.81, z: 0.0 };
      const world = new RAPIER.World(gravity);
      worldRef.current = world;
      gameObjectManagerRef.current = new GameObjectManager(world);
      unitManagerRef.current = new UnitManager();
    }
  }, []);

  const mapModel = useModelStore((s) => s.models[currentMap]);
  // 🗺 Load the current map from the model store
  useEffect(() => {
    if (!threeRef.current || !threeRef.current.scene || !mapModel?.gltf) return;

    const { scene } = threeRef.current;

    // Clear previous map
    while (scene.children.length > 0) {
      scene.remove(scene.children[0]);
    }

    scene.add(mapModel.gltf);

    console.log(`🗺 Map loaded from model store: ${currentMap}`);
  }, [mapModel, currentMap]);

  // 🎮 Render loop
  useEffect(() => {
    if (
      !isGameActive ||
      !threeRef.current ||
      !worldRef.current ||
      !gameObjectManagerRef.current
    )
      return;

    const { scene, camera, renderer, controls } = threeRef.current;
    const world = worldRef.current;
    const gameObjectManager = gameObjectManagerRef.current;
    const unitManager = unitManagerRef.current;
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const render = () => {
      if (!isGameActive) return;
      const delta = clock.getDelta();
      world.step();
      gameObjectManager.update(delta);
      unitManager?.update(delta);
      controls.update();
      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationFrameId);
  }, [isGameActive]);

  useEffect(() => {
    if (roundState !== "battle") return;
    const intervalId = setInterval(() => {
      setRoundTimer((prev) => {
        if (prev <= 1) {
          setRoundState("end");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalId);
  }, [roundState]);

  useEffect(() => {
    if (roundState !== "end") return;
    setPlayers((prev) => prev.map((p) => ({ ...p, gold: p.gold + 20 })));
    setTimeout(() => {
      setCurrentRound((r) => r + 1);
      setRoundState("setup");
      setRoundTimer(30); // default round duration
    }, 3000);
  }, [roundState]);

  const startGame = () => {
    if (!gameObjectManagerRef.current) return alert("Game not ready");
    setIsGameActive(true);
    setRoundState("battle");
    setRoundTimer(30);
  };

  return (
    <div
      ref={containerRef}
      style={{ position: "relative", width: "100vw", height: "100vh" }}
    >
      <div
        style={{
          position: "absolute",
          top: 20,
          left: 20,
          color: "white",
          zIndex: 10,
        }}
      >
        <button
          onClick={() => {
            const scene = sceneRef.current;
            const world = worldRef.current;
            const unitManager = unitManagerRef.current;
            const gameObjectManager = gameObjectManagerRef.current;
            const grid1 = placementRef.current?.getGridPositions();
            const grid2 = placementRef2.current?.getGridPositions();

            if (
              !scene ||
              !world ||
              !unitManager ||
              !gameObjectManager ||
              !grid1 ||
              !grid2
            ) {
              console.warn("Missing refs for spawning");
              return;
            }

            fillUnitOnGrid({
              unitType: "knight1",
              playerId: 1,
              scene,
              world,
              unitManager,
              gameObjectManager,
              gridPositions: grid1,
            });

            fillUnitOnGrid({
              unitType: "knight1",
              playerId: 2,
              scene,
              world,
              unitManager,
              gameObjectManager,
              gridPositions: grid2,
            });
          }}
          style={{
            marginTop: "10px",
            padding: "5px 10px",
            backgroundColor: "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Fill Grid with Knights
        </button>

        <div>Round: {currentRound}</div>
        <div>Round State: {roundState}</div>
        <div>Timer: {roundTimer}</div>
        {players.map((player) => (
          <div key={player.id}>
            Player {player.id} - Gold: {player.gold}
          </div>
        ))}
        {!isGameActive && <button onClick={startGame}>Start Game</button>}
      </div>

      {threeRef.current && (
        <>
          <UnitPlacementSystem
            ref={placementRef}
            scene={threeRef.current.scene}
            playerId={1}
            tileSize={2}
          />
          <UnitPlacementSystem
            ref={placementRef2}
            scene={threeRef.current.scene}
            playerId={2}
            tileSize={2}
          />
        </>
      )}
    </div>
  );
};

export default AutoBattler;
