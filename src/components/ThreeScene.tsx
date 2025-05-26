"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import {
  DRACOLoader,
  GLTFLoader,
} from "three/examples/jsm/Addons.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import * as RAPIER from "@dimforge/rapier3d";

import { GameObjectManager } from "@/components/ecs/GameObjectManager";
import { GroundMesh } from "./meshes/GroundMesh";
import { StaticBody } from "./physics/StaticBody";
import { BoxCollider } from "./physics/BoxCollider";
import { Vector3 } from "three";
import { UnitManager } from "./units/UnitManager";
import { CharacterRigidbody } from "./physics/CharacterRigidbody";
import { ProjectileManager } from "./projectiles/ProjectileManager";
import { Priest } from "./units/Priest";
import { Knight } from "./units/Knight";
import { useModelStore } from "./ModelStore";
import { models } from "./meshes/ModelList";

interface Globals {
  time: number;
  deltaTime: number;
  gravity: THREE.Vector3 | RAPIER.Vector3;
}

export const ThreeScene: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const setModel = useModelStore((s) => s.setModel);
  const getModel = useModelStore.getState().getModel;

  const globals = useRef<Globals>({
    time: 0,
    deltaTime: 0,
    gravity: new THREE.Vector3(0, -9.81, 0),
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const gravity = { x: 0.0, y: -9.81, z: 0.0 };
    globals.current.gravity = gravity;

    const world = new RAPIER.World(gravity);
    const bodyDesc = RAPIER.RigidBodyDesc.dynamic().setTranslation(0, 5, 0);
    const body = world.createRigidBody(bodyDesc);
    const colliderDesc = RAPIER.ColliderDesc.cuboid(0.5, 0.5, 0.5);
    world.createCollider(colliderDesc, body);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x202020);

    const gameObjectManager = new GameObjectManager(world);
    const unitManager = new UnitManager();
    const projectileManager = new ProjectileManager(gameObjectManager, scene, world);

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

    const obj = gameObjectManager.createGameObject(scene, "ground", "");
    obj.transform.position.set(0, -0.5, 0);
    obj.addComponent(GroundMesh, 10, 1, 10);
    const collider = obj.addComponent(BoxCollider, 10, 1, 10);
    obj.addComponent(StaticBody, world, collider.description);

    const dirLight = new THREE.DirectionalLight(0xffffff, 10);
    dirLight.target.position.set(0, 0, 0);
    scene.add(dirLight);

    const controls = new OrbitControls(camera, renderer.domElement);

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
              animsByName[clip.name] = clip;
            });

            setModel(key, {
              gltf: gltfScene,
              animations: animsByName,
              damagePoint1: model.damagePoint1,
            });
          },
          undefined,
          (error) => {
            console.error(`Failed to load ${model.url}`, error);
          }
        );
      });
    };

    const initUnits = () => {
      const offset = new Vector3(0, 0.8, 0);

      const knightModel = getModel("knight1");
      if (knightModel?.gltf) {
        const knight = unitManager.createUnit(
          Knight,
          gameObjectManager,
          scene,
          "knight1",
          knightModel,
          world,
          offset,
          new Vector3(0.4, 1.5, 0.4),
          1
        );
        knight?.getComponent(CharacterRigidbody)?.setPosition(new Vector3(-4, 0, -4));
      }

      const priestModel = getModel("priest1");
      if (priestModel?.gltf) {
        const priest = unitManager.createUnit(
          Priest,
          gameObjectManager,
          scene,
          "priest1",
          priestModel,
          world,
          offset,
          new Vector3(0.4, 1.5, 0.4),
          1
        );
        priest?.getComponent(CharacterRigidbody)?.setPosition(new Vector3(4, 0, -4));
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
      container.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

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
