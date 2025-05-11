"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import {
  DRACOLoader,
  GLTF,
  GLTFLoader,
  SkeletonUtils,
} from "three/examples/jsm/Addons.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import * as RAPIER from "@dimforge/rapier3d";

import { loadedModels, models } from "@/components/meshes/ModelList";
import { GameObjectManager } from "@/components/ecs/GameObjectManager";
import { GroundMesh } from "./meshes/GroundMesh";
import { StaticBody } from "./physics/StaticBody";
import { BoxCollider } from "./physics/BoxCollider";
import { Vector3 } from "three";
import { UnitManager } from "./units/UnitManager";
import { CharacterRigidbody } from "./physics/CharacterRigidbody";
import { ProjectileManager } from "./projectiles/ProjectileManager";

interface Globals {
  time: number;
  deltaTime: number;
  gravity: THREE.Vector3 | RAPIER.Vector3;
}

export const ThreeScene: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Physics refs
  const worldRef = useRef<RAPIER.World | null>(null);
  const bodyRef = useRef<RAPIER.RigidBody | null>(null);

  // Global timing / physics params
  const globals = useRef<Globals>({
    time: 0,
    deltaTime: 0,
    gravity: new THREE.Vector3(0, -9.81, 0),
  });

  /* ------------------------------ EFFECT ------------------------------ */
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const gravity = { x: 0.0, y: -9.81, z: 0.0 };
    globals.current.gravity = gravity;

    // Physics setup
    const world = new RAPIER.World(gravity);
    worldRef.current = world;

    const bodyDesc = RAPIER.RigidBodyDesc.dynamic().setTranslation(0, 5, 0);
    const body = world.createRigidBody(bodyDesc);
    const colliderDesc = RAPIER.ColliderDesc.cuboid(0.5, 0.5, 0.5);
    world.createCollider(colliderDesc, body);
    bodyRef.current = body;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x202020);

    const gameObjectManager = new GameObjectManager(world);
    const unitManager = new UnitManager();
    const projectileManager = new ProjectileManager(
      gameObjectManager,
      scene,
      world
    );

    const camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 2, 5);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    (() => {
      const obj = gameObjectManager.createGameObject(scene, "ground", "");
      const width = 10,
        depth = 10;
      obj.transform.position.set(0, -0.5, 0);
      obj.addComponent(GroundMesh, width, 1, depth);

      const collider = obj.addComponent(BoxCollider, width, 1, depth);
      obj.addComponent(StaticBody, world, collider.description);
    })();

    const dirLight = new THREE.DirectionalLight(0xffffff, 10);
    dirLight.target.position.set(0, 0, 0);
    scene.add(dirLight);

    const controls = new OrbitControls(camera, renderer.domElement);

    type MixerInfo = {
      mixer: THREE.AnimationMixer;
      clips: THREE.AnimationClip[];
    };
    const mixerInfos: MixerInfo[] = [];

    const loadGLTF = () => {
      const loadingManager = new THREE.LoadingManager();
      loadingManager.onLoad = initUnits;

      const gltfLoader = new GLTFLoader(loadingManager);
      const dracoLoader = new DRACOLoader();
      dracoLoader.setDecoderPath("/examples/jsm/libs/draco/");
      gltfLoader.setDRACOLoader(dracoLoader);

      Object.entries(models).forEach(([key, model]) => {
        gltfLoader.load(
          model.url,
          (gltf) => {
            const gltfScene = gltf.scene;
            const animsByName: Record<string, THREE.AnimationClip> = {};

            gltf.animations.forEach((clip) => {
              const match = clip.name.match(/^(?:[^_]+_){2}(.+)$/);
              if (match) clip.name = match[1];
              console.log(`Loaded animation: ${clip.name}`);
              animsByName[clip.name] = clip;
            });

            // Correctly assign cloned scene and animations
            loadedModels[key] = {
              gltf: gltfScene,
              animations: animsByName,
            };
          },
          undefined,
          (error) => {
            console.error(`Failed to load ${model.url}`, error);
          }
        );
      });
    };

    const initUnits = () => {
      Object.values(loadedModels).forEach((model) => {
        if (!model.gltf) return;
      });

      const offset = new Vector3(0, 0.8, 0);

      const knightModel = loadedModels.knight1;
      if (knightModel.gltf) {
        const knight = unitManager.createKnight(
          gameObjectManager,
          scene,
          "knight1",
          knightModel,
          world,
          offset,
          new Vector3(0.4, 1.5, 0.4),
          1
        );
        knight
          ?.getComponent(CharacterRigidbody)
          ?.setPosition(new Vector3(-4, 0, -4));
      }

      const priestModel = loadedModels.priest1;

      if (priestModel.gltf) {
        const priest = unitManager.createPriest(
          gameObjectManager,
          scene,
          "priest1",
          priestModel,
          world,
          offset,
          new Vector3(0.4, 1.5, 0.4),
          1
        );
        priest
          ?.getComponent(CharacterRigidbody)
          ?.setPosition(new Vector3(4, 0, -4));
      }
    };

    const clock = new THREE.Clock();

    const renderLoop = () => {
      requestAnimationFrame(renderLoop);

      const delta = clock.getDelta();
      globals.current.time += delta;
      globals.current.deltaTime = Math.min(delta, 1 / 20);

      controls.update();
      dirLight.position.copy(camera.position);

      gameObjectManager.update(globals.current.deltaTime);
      unitManager.update(globals.current.deltaTime);

      renderer.render(scene, camera);
    };

    loadGLTF();
    renderLoop();

    const onResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      if (container) container.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  /* ------------------ JSX RENDER -------------------------------------- */
  return (
    <div
      ref={containerRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "auto",
      }}
    />
  );
};

export default ThreeScene;
