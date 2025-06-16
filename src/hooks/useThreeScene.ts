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
  isLoaded: boolean
) => {
  const threeRef = useRef<ThreeSceneRef | undefined>(undefined);
  const sceneRef = useRef<THREE.Scene | undefined>(undefined);

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
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(
      containerRef.current.clientWidth,
      containerRef.current.clientHeight
    );
    renderer.shadowMap.enabled = true;
    containerRef.current.appendChild(renderer.domElement);

    // Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.0;
    controls.target.set(0, 0, 0);
    controls.update();

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
      controls.dispose();
      renderer.dispose();
      sceneRef.current = undefined;
      threeRef.current = undefined;
    };
  }, [containerRef, isLoaded]);

  return { threeRef, sceneRef };
};
