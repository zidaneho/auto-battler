"use client";

import React, { useRef, useEffect } from "react";
import * as THREE from "three";
import { DRACOLoader, GLTFLoader } from "three/examples/jsm/Addons.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { models } from "@/components/meshes/ModelList";
import { GameObjectManager } from "@/components/ecs/GameObjectManager";
import * as RAPIER from "@dimforge/rapier3d";
import { GroundMesh } from "./meshes/GroundMesh";
import { StaticBody } from "./physics/StaticBody";
import { BoxCollider } from "./physics/BoxCollider";
import { Vector3, vector3_distance } from "./ecs/Vector3";
import { UnitManager } from "./units/UnitManager";
import { CharacterRigidbody } from "./physics/CharacterRigidbody";
import { ProjectileManager } from "./projectiles/ProjectileManager";

export const ThreeScene = () => {
  const containerRef = useRef(null);
  const worldRef = useRef(null);
  const bodyRef = useRef(null);

  const globals = {
    time: 0,
    deltaTime: 0,
    gravity: -9.81,
  };

  useEffect(() => {
    if (!containerRef.current) return;

    //setup physics
    async function setupPhysics() {
      const gravity = { x: 0.0, y: -9.81, z: 0.0 };
      globals.gravity = gravity;
      const world = new RAPIER.World(gravity);
      worldRef.current = world;

      // Setup Rapier body
      const bodyDesc = RAPIER.RigidBodyDesc.dynamic().setTranslation(0, 5, 0);
      const body = world.createRigidBody(bodyDesc);
      const colliderDesc = RAPIER.ColliderDesc.cuboid(0.5, 0.5, 0.5);
      world.createCollider(colliderDesc, body);
      bodyRef.current = body;
    }
    setupPhysics();

    // === Scene Setup ===
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x202020);

    const gameObjectManager = new GameObjectManager(worldRef.current);
    const unitManager = new UnitManager();
    const projectileManager = new ProjectileManager(
      gameObjectManager,
      scene,
      worldRef.current
    );

    // === Camera ===
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 5;
    camera.position.y = 2;

    // === Renderer ===
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(
      containerRef.current.clientWidth,
      containerRef.current.clientHeight
    );
    containerRef.current.appendChild(renderer.domElement);

    // === Add Objects ===
    {
      const gameObject = gameObjectManager.createGameObject(
        scene,
        "ground",
        ""
      );
      const width = 10;
      const depth = 10;
      gameObject.transform.position.set(0, -0.5, 0);
      gameObject.addComponent(GroundMesh, width, 1, depth);
      const collider = gameObject.addComponent(BoxCollider, width, 1, depth);
      const staticBody = gameObject.addComponent(
        StaticBody,
        worldRef.current,
        collider.description
      );
    }

    load_gltf();

    // === Lights ===
    const light = new THREE.DirectionalLight(0xffffff, 1);

    light.target.position.set(0, 0, 0); // Pointing at the ground (origin)
    light.intensity = 10;
    scene.add(light);

    // === Controls ===
    const controls = new OrbitControls(camera, renderer.domElement);

    // === Animation Loop ===
    //DO NOT REMOVE THIS. WE NEED THIS TO RENDER THE SCENE
    const mixerInfos = [];
    const clock = new THREE.Clock();
    const render = () => {
      requestAnimationFrame(render);

      const delta = clock.getDelta();
      globals.time += delta;

      //delta time should not be more than 1/20th of a second.
      globals.deltaTime = Math.min(delta, 1 / 20);

      //we are able to move the camera around with this
      controls.update();
      light.position.set(
        camera.position.x,
        camera.position.y,
        camera.position.z
      ); // Up high above the scene

      gameObjectManager.update(globals.deltaTime);
      unitManager.update(globals.deltaTime);
      renderer.render(scene, camera);
    };
    render();

    // === Handle Resize ===
    const handleResize = () => {
      if (!containerRef.current) return;
      camera.aspect =
        containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(
        containerRef.current.clientWidth,
        containerRef.current.clientHeight
      );
    };
    window.addEventListener("resize", handleResize);

    //plays next animation for particular models (1-8 keys)
    window.addEventListener("keydown", (e) => {
      const mixerInfo = mixerInfos[e.keyCode - 49];
      if (!mixerInfo) {
        return;
      }
      playNextAction(mixerInfo);
    });

    function load_gltf() {
      const loadingManager = new THREE.LoadingManager();
      loadingManager.onLoad = init;
      const loader = new GLTFLoader(loadingManager);

      // Optional: Provide a DRACOLoader instance to decode compressed mesh data
      const dracoLoader = new DRACOLoader();
      dracoLoader.setDecoderPath("/examples/jsm/libs/draco/");
      loader.setDRACOLoader(dracoLoader);
      {
        for (const model of Object.values(models)) {
          loader.load(model.url, (gltf) => {
            model.gltf = gltf;
          });
        }
      }

      function prepModelsAndAnimations() {
        Object.values(models).forEach((model) => {
          console.log("------->:", model.url);
          const animsByName = {};
          model.gltf.animations.forEach((clip) => {
            const match = clip.name.match(/^(?:[^_]+_){2}(.+)$/);

            if (match) {
              clip.name = match[1];
            }

            animsByName[clip.name] = clip;
            console.log("  ", clip.name);
          });
          model.animations = animsByName;
        });
      }
      function init() {
        prepModelsAndAnimations();
        {
          const offset = new Vector3(0, 0.8, 0);
          const gameObject = unitManager.createKnight(
            gameObjectManager,
            scene,
            "knight1",
            models.knight1,
            worldRef.current,
            offset,
            new Vector3(0.4, 1.5, 0.4),
            1
          );
          const rigidbody = gameObject.getComponent(CharacterRigidbody);
          rigidbody.setPosition(new Vector3(-4, 0, -4));
        }
        {
          const offset = new Vector3(0, 0.8, 0);
          const gameObject = unitManager.createKnight(
            gameObjectManager,
            scene,
            "knight2",
            models.knight1,
            worldRef.current,
            offset,
            new Vector3(0.4, 1.5, 0.4),
            2
          );
          const rigidbody = gameObject.getComponent(CharacterRigidbody);
          rigidbody.setPosition(new Vector3(4, 0, 4));
        }
        {
          const offset = new Vector3(0, 0.8, 0);
          const arrowSpawnPoint = new Vector3(0.06, 1.09, 0.8);
          const gameObject = unitManager.createArcher(
            gameObjectManager,
            scene,
            "archer1",
            models.archer1,
            worldRef.current,
            offset,
            new Vector3(0.4, 1.5, 0.4),
            2,
            projectileManager,
            arrowSpawnPoint
          );
          const rigidbody = gameObject.getComponent(CharacterRigidbody);
          rigidbody.setPosition(new Vector3(-4, 0, 4));
        }
      }
    }

    // === Cleanup ===
    return () => {
      window.removeEventListener("resize", handleResize);
      containerRef.current?.removeChild(renderer.domElement);
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
