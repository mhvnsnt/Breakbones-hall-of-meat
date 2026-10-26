import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RagdollPhysics } from '../physics/ragdoll';
import { StuntWorld, STUNT_SPOTS } from '../game/stuntWorld';
import { DestructiblesManager } from '../physics/destructibles';
import { VehicleType, RagdollPose, StuntSpot, Challenge } from '../types/game';
import { soundEngine } from '../audio/soundEngine';

interface GameCanvasProps {
  vehicle: VehicleType;
  currentPose: RagdollPose;
  isBailed: boolean;
  isSlowMo: boolean;
  onBailChange: (bailed: boolean) => void;
  onPoseChange: (pose: RagdollPose) => void;
  onStatsUpdate: (stats: {
    speed: number;
    airTime: number;
    flightDist: number;
    hospitalBill: number;
    brokenCount: number;
    score: number;
    multiplier: number;
    rotations: number;
  }) => void;
  onBoneImpact: (boneName: string, bill: number) => void;
  ragdollRef: React.MutableRefObject<RagdollPhysics | null>;
  activeSpot: StuntSpot;
  virtualInput: { x: number; y: number; jump: boolean; sprint: boolean };
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  vehicle,
  currentPose,
  isBailed,
  isSlowMo,
  onBailChange,
  onPoseChange,
  onStatsUpdate,
  onBoneImpact,
  ragdollRef,
  activeSpot,
  virtualInput,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<StuntWorld | null>(null);
  const destructiblesRef = useRef<DestructiblesManager | null>(null);

  // Keyboard input state
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const cameraAngleRef = useRef({ theta: 0, phi: 0.35, distance: 7 });
  const isPointerDownRef = useRef(false);
  const prevPointerRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!containerRef.current) return;

    // 1. Setup Three.js Scene, Camera, Renderer
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(65, width / height, 0.1, 500);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    containerRef.current.replaceChildren(renderer.domElement);

    // 2. Build World, Ragdoll, Destructibles
    const world = new StuntWorld(scene);
    worldRef.current = world;

    const destructibles = new DestructiblesManager();
    destructiblesRef.current = destructibles;
    scene.add(destructibles.group);

    const ragdoll = new RagdollPhysics();
    ragdollRef.current = ragdoll;
    scene.add(ragdoll.meshGroup);

    // Initial Spawn
    const spawnVec = new THREE.Vector3(...activeSpot.spawnPosition);
    ragdoll.resetTo(spawnVec, activeSpot.spawnRotation);

    // 3. Particle System for Dust & Debris
    const particleCount = 200;
    const particleGeom = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleVelocities = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i++) {
      particlePositions[i] = 0;
      particleVelocities[i] = 0;
    }
    particleGeom.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0xfbbf24,
      size: 0.25,
      transparent: true,
      opacity: 0.8,
    });
    const particleSystem = new THREE.Points(particleGeom, particleMat);
    scene.add(particleSystem);

    const emitParticlesAt = (pos: THREE.Vector3) => {
      const positions = particleGeom.attributes.position.array as Float32Array;
      for (let i = 0; i < 20; i++) {
        const idx = Math.floor(Math.random() * particleCount) * 3;
        positions[idx] = pos.x + (Math.random() - 0.5) * 0.5;
        positions[idx + 1] = pos.y + (Math.random() - 0.5) * 0.5;
        positions[idx + 2] = pos.z + (Math.random() - 0.5) * 0.5;
        particleVelocities[idx] = (Math.random() - 0.5) * 12;
        particleVelocities[idx + 1] = Math.random() * 8 + 2;
        particleVelocities[idx + 2] = (Math.random() - 0.5) * 12;
      }
      particleGeom.attributes.position.needsUpdate = true;
    };

    // 4. Keyboard Event Listeners
    const onKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.code] = true;

      // Space to Jump
      if (e.code === 'Space' && !ragdoll.isBailed) {
        // Handled in frame loop
      }

      // 'B' or 'KeyB' to Trigger Bail
      if (e.code === 'KeyB') {
        ragdoll.triggerBail();
        onBailChange(true);
      }

      // 'KeyR' to Respawn
      if (e.code === 'KeyR') {
        const spawn = new THREE.Vector3(...activeSpot.spawnPosition);
        ragdoll.resetTo(spawn, activeSpot.spawnRotation);
        onBailChange(false);
      }

      // 1-6 for Mid-Air Poses
      if (ragdoll.isBailed) {
        if (e.code === 'Digit1') onPoseChange('cannonball');
        if (e.code === 'Digit2') onPoseChange('spread_eagle');
        if (e.code === 'Digit3') onPoseChange('torpedo');
        if (e.code === 'Digit4') onPoseChange('judo_kick');
        if (e.code === 'Digit5') onPoseChange('flying_squirrel');
        if (e.code === 'Digit6') onPoseChange('meat_hook');
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.code] = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    // 5. Pointer / Touch Orbit Camera Listeners
    const dom = renderer.domElement;
    const onPointerDown = (e: PointerEvent) => {
      // If clicking directly on canvas (not on HUD)
      isPointerDownRef.current = true;
      prevPointerRef.current = { x: e.clientX, y: e.clientY };
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isPointerDownRef.current) return;
      const dx = e.clientX - prevPointerRef.current.x;
      const dy = e.clientY - prevPointerRef.current.y;
      prevPointerRef.current = { x: e.clientX, y: e.clientY };

      cameraAngleRef.current.theta -= dx * 0.006;
      cameraAngleRef.current.phi = Math.max(0.1, Math.min(Math.PI / 2.1, cameraAngleRef.current.phi + dy * 0.006));
    };

    const onPointerUp = () => {
      isPointerDownRef.current = false;
    };

    dom.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    // 6. Resize Observer
    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // 7. Animation Loop
    let animId: number;
    let lastTime = performance.now();
    let prevBrokenCount = 0;

    const animate = (time: number) => {
      animId = requestAnimationFrame(animate);

      const rawDt = (time - lastTime) / 1000;
      lastTime = time;

      // Bullet Time / Slow Mo
      const dt = isSlowMo ? rawDt * 0.25 : Math.min(rawDt, 0.05);

      // Collect Input (Keyboard + Mobile Virtual Joystick)
      let inputX = virtualInput.x;
      let inputY = virtualInput.y;
      let jump = virtualInput.jump || keysRef.current['Space'] || false;
      let sprint = virtualInput.sprint || keysRef.current['ShiftLeft'] || false;

      if (keysRef.current['KeyA'] || keysRef.current['ArrowLeft']) inputX -= 1;
      if (keysRef.current['KeyD'] || keysRef.current['ArrowRight']) inputX += 1;
      if (keysRef.current['KeyW'] || keysRef.current['ArrowUp']) inputY += 1;
      if (keysRef.current['KeyS'] || keysRef.current['ArrowDown']) inputY -= 1;

      // Sync vehicle & pose props to ragdoll
      ragdoll.setVehicle(vehicle);
      ragdoll.setPose(currentPose);

      // Combine world colliders and destructible colliders
      const allColliders = [
        ...world.colliders,
        ...destructibles.objects.map(o => o.collider),
      ];

      // Update Ragdoll Physics
      ragdoll.update(
        dt,
        { x: inputX, y: inputY, jump, sprint },
        (x, z) => world.getTerrainHeight(x, z),
        allColliders
      );

      // Update Destructibles & Traffic
      destructibles.update(dt);

      // Sound Engine continuous ambient cues
      const currentSpeed = ragdoll.characterVel.length();
      soundEngine.setSpeedSounds(currentSpeed, !ragdoll.isGrounded, ragdoll.vehicle);

      // Check for new bone fractures
      const brokenCount = ragdoll.getBrokenCount();
      if (brokenCount > prevBrokenCount) {
        emitParticlesAt(ragdoll.characterPos);
        const lastImpact = ragdoll.impactEvents[ragdoll.impactEvents.length - 1];
        if (lastImpact) {
          onBoneImpact(lastImpact.boneName, lastImpact.bill);
        }
        prevBrokenCount = brokenCount;
      }

      // Check if ragdoll bailed automatically on hard impact
      if (ragdoll.isBailed && !isBailed) {
        onBailChange(true);
      }

      // Send telemetry stats up to React HUD
      onStatsUpdate({
        speed: currentSpeed,
        airTime: ragdoll.currentAirTime,
        flightDist: ragdoll.totalFlightDist,
        hospitalBill: ragdoll.totalHospitalBill,
        brokenCount,
        score: ragdoll.bailScore,
        multiplier: ragdoll.scoreMultiplier,
        rotations: ragdoll.rotationsCount,
      });

      // Update Particles
      const pPositions = particleGeom.attributes.position.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        const idx = i * 3;
        particleVelocities[idx + 1] -= 18 * dt; // gravity
        pPositions[idx] += particleVelocities[idx] * dt;
        pPositions[idx + 1] += particleVelocities[idx + 1] * dt;
        pPositions[idx + 2] += particleVelocities[idx + 2] * dt;

        if (pPositions[idx + 1] < 0) {
          pPositions[idx + 1] = -100; // hide below ground
        }
      }
      particleGeom.attributes.position.needsUpdate = true;

      // 8. Smooth Camera Tracking
      const targetPos = ragdoll.characterPos.clone();
      if (ragdoll.isBailed) {
        // Tumble camera - follow torso with high action angle
        targetPos.y += 0.5;
        cameraAngleRef.current.distance = THREE.MathUtils.lerp(cameraAngleRef.current.distance, 6, 0.05);
      } else {
        targetPos.y += 1.3;
        cameraAngleRef.current.distance = THREE.MathUtils.lerp(cameraAngleRef.current.distance, 7.5, 0.05);
      }

      const theta = ragdoll.isBailed ? cameraAngleRef.current.theta : ragdoll.characterHeading + cameraAngleRef.current.theta;
      const phi = cameraAngleRef.current.phi;
      const dist = cameraAngleRef.current.distance;

      const camX = targetPos.x + dist * Math.sin(phi) * Math.sin(theta);
      const camY = targetPos.y + dist * Math.cos(phi);
      const camZ = targetPos.z + dist * Math.sin(phi) * Math.cos(theta);

      camera.position.lerp(new THREE.Vector3(camX, Math.max(0.6, camY), camZ), 0.12);
      camera.lookAt(targetPos);

      // Render Scene
      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      dom.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, [activeSpot]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative cursor-grab active:cursor-grabbing overflow-hidden touch-none"
    />
  );
};
