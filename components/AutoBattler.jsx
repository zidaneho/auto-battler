import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GameObjectManager } from './components/ecs/GameObjectManager';
import * as RAPIER from '@dimforge/rapier3d';
import { Vector3 } from './components/ecs/Vector3';
import { UnitManager } from './components/units/UnitManager';
import { CharacterRigidbody } from './components/physics/CharacterRigidbody';
import { ProjectileManager } from './components/projectiles/ProjectileManager';

const UNIT_COSTS = {
    knight1: 10,
    archer1: 15,
    priest1: 20,
};

const MAPS = {
    map1: { map: { width: 10, depth: 10 }, duration: 30 },
    map2: { map: { width: 15, depth: 15 }, duration: 30 },
    map3: { map: { width: 20, depth: 20 }, duration: 30 },
};

const createUnitData = function(type, count) {
    return { type, count };
};

const AutoBattler = () => {
    const [players, setPlayers] = useState([
        { id: 1, gold: 100, units: [], board: [] },
        { id: 2, gold: 100, units: [], board: [] },
    ]);
    const [currentRound, setCurrentRound] = useState(1);
    const [roundState, setRoundState] = useState('setup');
    const [currentMap, setCurrentMap] = useState('map1');
    const [roundTimer, setRoundTimer] = useState(MAPS[currentMap].duration);
    const [isGameActive, setIsGameActive] = useState(false);
    const containerRef = useRef(null);
    const worldRef = useRef(null);
    const gameObjectManagerRef = useRef(null);
    const unitManagerRef = useRef(null);
    const sceneRef = useRef(null);

    const threeRef = useRef(null);

    useEffect(() => {
        if (!containerRef.current) return;
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x202020);
        sceneRef.current = scene;

        const camera = new THREE.PerspectiveCamera(75, containerRef.current.clientWidth / containerRef.current.clientHeight, 0.1, 1000);
        camera.position.set(0, 2, 5);

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
        containerRef.current.appendChild(renderer.domElement);

        const loadingManager = new THREE.LoadingManager();
        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath('/examples/jsm/loaders/DRACOLoader.js');
        const gltfLoader = new GLTFLoader(loadingManager);
        gltfLoader.setDRACOLoader(dracoLoader);

        const controls = new OrbitControls(camera, renderer.domElement);
        threeRef.current = { scene, camera, renderer, controls, loadingManager, gltfLoader };

        const handleResize = () => {
            if (!containerRef.current || !threeRef.current) return;
            const { camera, renderer } = threeRef.current;
            camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
        };

        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
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

    useEffect(() => {
        if (!threeRef.current) return;
        const { loadingManager, gltfLoader } = threeRef.current;
                loadingManager.onLoad = () => {
            console.log("All models loaded");
            setIsGameActive(true);
        };
    }, []);

    useEffect(() => {
        if (!isGameActive || !threeRef.current || !worldRef.current || !gameObjectManagerRef.current) return;
        const { scene, camera, renderer, controls } = threeRef.current;
        const world = worldRef.current;
        const gameObjectManager = gameObjectManagerRef.current;
        const unitManager = unitManagerRef.current;
        let animationFrameId;
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
        if (roundState !== 'battle') return;
        const intervalId = setInterval(() => {
            setRoundTimer(prev => {
                if (prev <= 1) {
                    setRoundState('end');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(intervalId);
    }, [roundState]);

    useEffect(() => {
        if (roundState !== 'end') return;
        setPlayers(prev => prev.map(p => ({ ...p, gold: p.gold + 20 })));
        setTimeout(() => {
            setCurrentRound(r => r + 1);
            setRoundState('setup');
            setRoundTimer(MAPS[currentMap].duration);
        }, 3000);
    }, [roundState, currentMap]);

    const startGame = () => {
        if (!gameObjectManagerRef.current) return alert("Game not ready");
        setIsGameActive(true);
        setRoundState('battle');
        setRoundTimer(MAPS[currentMap].duration);
    };

    return (
        <div ref={containerRef} style={{ position: 'relative', width: '100vw', height: '100vh' }}>
            <div style={{ position: 'absolute', top: 20, left: 20, color: 'white', zIndex: 10 }}>
                <div>Round: {currentRound}</div>
                <div>Round State: {roundState}</div>
                <div>Timer: {roundTimer}</div>
                {players.map(player => (
                    <div key={player.id}>
                        Player {player.id} - Gold: {player.gold}
                    </div>
                ))}
                {!isGameActive && <button onClick={startGame}>Start Game</button>}
            </div>
        </div>
    );
};

export default AutoBattler;
