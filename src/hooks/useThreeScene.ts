import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

export interface ThreeSceneRef {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  controls: OrbitControls;
}

export const useThreeScene = (
  containerRef: React.RefObject<HTMLDivElement | null>,
  isLoaded: boolean // To ensure setup runs after assets potentially needed by scene are ready
) => {
  const threeRef = useRef<ThreeSceneRef | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null); // Also export sceneRef for direct use if needed

  useEffect(() => {
    if (!containerRef.current || !isLoaded) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a202c);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      60,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 15, 20);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(
      containerRef.current.clientWidth,
      containerRef.current.clientHeight
    );
    renderer.shadowMap.enabled = true;
    containerRef.current.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0, 0);

    threeRef.current = { scene, camera, renderer, controls };

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 15, 10);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    const handleResize = () => {
      if (!containerRef.current || !threeRef.current) return;
      const { camera: cam, renderer: rend } = threeRef.current;
      cam.aspect =
        containerRef.current.clientWidth / containerRef.current.clientHeight;
      cam.updateProjectionMatrix();
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
      renderer.dispose();
      sceneRef.current = null;
      threeRef.current = null;
    };
  }, [containerRef, isLoaded]);

  return { threeRef, sceneRef };
};