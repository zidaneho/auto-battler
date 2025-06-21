// src/hooks/useThreeScene.ts

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

export interface ThreeSceneRef {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  controls: OrbitControls;

  overlayScene: THREE.Scene;
  overlayCamera: THREE.OrthographicCamera;
}

export const useThreeScene = (
  containerRef: React.RefObject<HTMLDivElement | null>,
  isLoaded: boolean
) => {
  const [threeScene, setThreeScene] = useState<ThreeSceneRef | null>(null);

  useEffect(() => {
    if (!containerRef.current || !isLoaded) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a202c);

    const camera = new THREE.PerspectiveCamera(
      60,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 15, 20);
    camera.lookAt(0, 0, 0);

    const overlayScene = new THREE.Scene();
    const { clientWidth, clientHeight } = containerRef.current;
    const overlayCamera = new THREE.OrthographicCamera(
      -clientWidth / 2,
      clientWidth / 2,
      clientHeight / 2,
      -clientHeight / 2,
      1,
      1000
    );
    overlayCamera.position.z = 10;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(
      containerRef.current.clientWidth,
      containerRef.current.clientHeight
    );
    renderer.shadowMap.enabled = true;
    containerRef.current.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(0, 0, 0);

    setThreeScene({
      scene,
      camera,
      renderer,
      controls,
      overlayScene,
      overlayCamera,
    });

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 15, 10);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    const handleResize = () => {
      if (!containerRef.current || !threeScene) return;
      const { camera: cam, renderer: rend } = threeScene;
      cam.aspect = clientWidth / clientHeight;
      cam.updateProjectionMatrix();

      overlayCamera.left = -clientWidth / 2;
      overlayCamera.right = clientWidth / 2;
      overlayCamera.top = clientHeight / 2;
      overlayCamera.bottom = -clientHeight / 2;
      overlayCamera.updateProjectionMatrix();

      rend.setSize(
        containerRef.current.clientWidth,
        containerRef.current.clientHeight
      );
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      controls.dispose();
      renderer.dispose();
      setThreeScene(null);
    };
  }, [containerRef, isLoaded]);

  return { threeScene };
};
