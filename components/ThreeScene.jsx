"use client";

import React, { useRef, useEffect } from "react";
import * as THREE from "three";
import { DRACOLoader, GLTFLoader } from "three/examples/jsm/Addons.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import * as SkeletonUtils from "three/addons/utils/SkeletonUtils.js";
import { models } from "@/components/ModelList";
import { GameObjectManager } from "@/components/ecs/GameObjectManager";
import { Unit } from "@/components/Unit";

export const ThreeScene = () => {
  const containerRef = useRef(null);
  const globals = {
    time: 0,
    deltaTime: 0,
  };
  const gameObjectManager = new GameObjectManager();

  useEffect(() => {
    if (!containerRef.current) return;

    // === Scene Setup ===
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x202020);

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
      //Ground Plane
      const ground_texture = new THREE.TextureLoader().load("/checker.png");
      ground_texture.wrapS = THREE.RepeatWrapping;
      ground_texture.wrapT = THREE.RepeatWrapping;
      const sizeX = 10;
      const sizeY = 10;
      const sizeZ = 10;
      ground_texture.repeat.set(sizeX, sizeY); // Tiles it 10x10 across the surface
      ground_texture.magFilter = THREE.NearestFilter;
      const ground_mat = new THREE.MeshBasicMaterial({
        map: ground_texture,
        side: THREE.DoubleSide,
      });

      const geometry = new THREE.PlaneGeometry(1, 1);
      const plane = new THREE.Mesh(geometry, ground_mat);
      plane.rotation.x = Math.PI / 2;
      plane.scale.set(sizeX, sizeY, sizeZ);
      scene.add(plane);
    }

    load_gltf();

    // === Lights ===
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(2, 2, 5);
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

      controls.update();
      renderer.render(scene, camera);
      gameObjectManager.update(globals.deltaTime);
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
            animsByName[clip.name] = clip;
            console.log("  ", clip.name);
          });
          model.animations = animsByName;
        });
      }
      function init() {
        prepModelsAndAnimations();
        {
          const gameObject = gameObjectManager.createGameObject(
            scene,
            "knight"
          );
          gameObject.addComponent(Unit);
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
