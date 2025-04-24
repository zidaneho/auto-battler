"use client";

import React, { useRef, useEffect } from "react";
import * as THREE from "three";
import { DRACOLoader, GLTFLoader } from "three/examples/jsm/Addons.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import * as SkeletonUtils from "three/addons/utils/SkeletonUtils.js";

export const ThreeScene = () => {
  const containerRef = useRef(null);

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

    // === Renderer ===
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(
      containerRef.current.clientWidth,
      containerRef.current.clientHeight
    );
    containerRef.current.appendChild(renderer.domElement);

    // === Add Objects ===
    const geometry = new THREE.PlaneGeometry(1, 1);
    const material = new THREE.MeshBasicMaterial({
      color: 0xffff00,
      side: THREE.DoubleSide,
    });
    const plane = new THREE.Mesh(geometry, material);
    plane.rotation.x = Math.PI / 2;
    scene.add(plane);
    load_gltf();

    // === Lights ===
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(2, 2, 5);
    scene.add(light);

    // === Controls ===
    const controls = new OrbitControls(camera, renderer.domElement);

    // === Animation Loop ===
    //DO NOT REMOVE THIS. WE NEED THIS TO RENDER THE SCENE
    const mixers = [];
    const clock = new THREE.Clock();
    const render = () => {
      requestAnimationFrame(render);
      const delta = clock.getDelta();

      controls.update();
      renderer.render(scene, camera);
      for (const mixer of mixers) {
        mixer.update(delta);
      }
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

    function load_gltf() {
      const models = {
        archer1: { url: "/models/gltf/archer/TT_Archer.glb" },
      };
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
          const animsByName = {};
          model.gltf.animations.forEach((clip) => {
            animsByName[clip.name] = clip;
          });
          model.animations = animsByName;
        });
      }
      function init() {
        prepModelsAndAnimations();

        Object.values(models).forEach((model, ndx) => {
          const clonedScene = SkeletonUtils.clone(model.gltf.scene);
          const root = new THREE.Object3D();
          root.add(clonedScene);
          scene.add(root);
          root.position.x = ndx - 1;

          const mixer = new THREE.AnimationMixer(clonedScene);
          const firstClip = Object.values(model.animations)[0];
          const action = mixer.clipAction(firstClip);
          action.play();
          mixers.push(mixer);
        });
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
