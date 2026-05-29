"use client";

import { useRef, useMemo, useEffect, useCallback, useState } from "react";
import { useFrame } from "@react-three/fiber";
import type { ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import type { Preset } from "@/components/overlay/OverlayButtons";
import { MAX_HITS, SHIELD_PRESETS } from "./consts";
import { useShieldControls } from "./useShieldControls";
import { createShieldMaterial } from "./shaderMaterial";
import { playLaser, playShieldImpact, playShieldReveal, playPlasma, playEmp } from "@/components/shared/audio";

interface ShieldProps {
  isActive?: boolean;
  posYOverride?: number;
  preset?: Preset;
}

interface Projectile {
  id: number;
  start: THREE.Vector3;
  target: THREE.Vector3;
  localTarget: THREE.Vector3;
  progress: number;
  type: "LASER_BOLT" | "PLASMA_BLAST" | "EMP_PULSE";
  color: string;
  size: number;
  speed: number;
}

interface Particle {
  id: number;
  pos: THREE.Vector3;
  velocity: THREE.Vector3;
  age: number;
  size: number;
  color: string;
}

function Shield({ isActive = false, posYOverride, preset }: ShieldProps) {
  const materialRef  = useRef<THREE.ShaderMaterial>(null!);
  const groupRef     = useRef<THREE.Group>(null!);
  const revealRef    = useRef(1);
  const timeRef      = useRef(0);
  const hitIdxRef    = useRef(0);
  const lifeRef      = useRef(1.0);
  const hitDamageRef = useRef(10);

  const [controls, setShield] = useShieldControls(lifeRef);
  const {
    debugAlwaysOn, manualReveal, revealProgress,
    posX, posY, posZ, scale, color,
    hexScale, hexOpacity, showHex, edgeWidth,
    fresnelPower, fresnelStrength, opacity, fadeStart, revealSpeed,
    flashSpeed, flashIntensity,
    noiseScale, noiseEdgeColor, noiseEdgeWidth, noiseEdgeIntensity, noiseEdgeSmoothness,
    flowScale, flowSpeed, flowIntensity,
    hitRingSpeed, hitRingWidth, hitDuration, hitIntensity, hitImpactRadius, hitMaxRadius,
    hitDamage,
    weaponType,
  } = controls;

  const visible = isActive || debugAlwaysOn;

  // Keep hitDamageRef in sync
  hitDamageRef.current = hitDamage;

  // Track projectiles and explosion particles in React state
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);

  // Apply preset values to Leva controls when preset changes
  useEffect(() => {
    if (preset) setShield(SHIELD_PRESETS[preset]);
  }, [preset]);

  // Play reveal charge sound when shield becomes visible
  const prevVisibleRef = useRef(visible);
  useEffect(() => {
    if (visible && !prevVisibleRef.current) {
      playShieldReveal();
    }
    prevVisibleRef.current = visible;
  }, [visible]);

  // ── Shader material ───────────────────────────────────────────────────────
  const shieldMaterial = useMemo(() => createShieldMaterial(), []);

  if (shieldMaterial && materialRef.current !== shieldMaterial) {
    materialRef.current = shieldMaterial;
  }

  // ── Sync Leva → uniforms ──────────────────────────────────────────────────
  useEffect(() => {
    if (!materialRef.current) return;
    const u = materialRef.current.uniforms;
    u.uColor.value.set(color);
    u.uHexScale.value         = hexScale;
    u.uHexOpacity.value       = hexOpacity;
    u.uShowHex.value          = showHex ? 1.0 : 0.0;
    u.uEdgeWidth.value        = edgeWidth;
    u.uFresnelPower.value     = fresnelPower;
    u.uFresnelStrength.value  = fresnelStrength;
    u.uOpacity.value          = opacity;
    u.uFadeStart.value        = fadeStart;
    u.uFlashSpeed.value       = flashSpeed;
    u.uFlashIntensity.value   = flashIntensity;
    u.uNoiseScale.value       = noiseScale;
    u.uNoiseEdgeColor.value.set(noiseEdgeColor);
    u.uNoiseEdgeWidth.value       = noiseEdgeWidth;
    u.uNoiseEdgeIntensity.value   = noiseEdgeIntensity;
    u.uNoiseEdgeSmoothness.value  = noiseEdgeSmoothness;
    u.uFlowScale.value        = flowScale;
    u.uFlowSpeed.value        = flowSpeed;
    u.uFlowIntensity.value    = flowIntensity;
    u.uHitRingSpeed.value     = hitRingSpeed;
    u.uHitRingWidth.value     = hitRingWidth;
    u.uHitMaxRadius.value     = hitMaxRadius;
    u.uHitDuration.value      = hitDuration;
    u.uHitIntensity.value     = hitIntensity;
    u.uHitImpactRadius.value  = hitImpactRadius;
  }, [
    color, hexScale, hexOpacity, showHex, edgeWidth,
    fresnelPower, fresnelStrength, opacity, fadeStart,
    flashSpeed, flashIntensity,
    noiseScale, noiseEdgeColor, noiseEdgeWidth, noiseEdgeIntensity, noiseEdgeSmoothness,
    flowScale, flowSpeed, flowIntensity,
    hitRingSpeed, hitRingWidth, hitMaxRadius, hitDuration, hitIntensity, hitImpactRadius,
  ]);

  // ── Click → Trigger laser launch based on weaponType ────────────────────────
  const handleClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (!materialRef.current) return;

    // e.point is world-space; worldToLocal gives object space
    const localPoint = e.object.worldToLocal(e.point.clone());
    const currentWeapon = weaponType || "LASER_BOLT";

    // Play appropriate procedural shooting sound
    if (currentWeapon === "LASER_BOLT") {
      playLaser();
    } else if (currentWeapon === "PLASMA_BLAST") {
      playPlasma();
    } else if (currentWeapon === "EMP_PULSE") {
      playEmp();
    }

    // Spawn projectile from camera's world position towards the hit target point
    const camPos = e.ray.origin.clone();
    
    let pColor = "#ffffff";
    let pSize = 0.07;
    let pSpeed = 4.2; // standard bolt speed

    if (currentWeapon === "PLASMA_BLAST") {
      pColor = "#00f5ff"; // neon cyan
      pSize = 0.22;       // heavy plasma orb
      pSpeed = 2.6;       // moves slower
    } else if (currentWeapon === "EMP_PULSE") {
      pColor = "#d500f9"; // neon magenta
      pSize = 0.04;       // fast electrical spark
      pSpeed = 7.0;       // ultra fast velocity
    }

    const newProj: Projectile = {
      id: Math.random(),
      start: camPos,
      target: e.point.clone(),
      localTarget: localPoint,
      progress: 0,
      type: currentWeapon,
      color: pColor,
      size: pSize,
      speed: pSpeed,
    };

    setProjectiles((prev) => [...prev, newProj]);
  }, [weaponType]);

  // ── Per-frame ─────────────────────────────────────────────────────────────
  useFrame((state, delta) => {
    if (!materialRef.current) return;

    timeRef.current = state.clock.elapsedTime;
    materialRef.current.uniforms.uTime.value = timeRef.current;
    materialRef.current.uniforms.uLife.value = lifeRef.current;

    if (manualReveal) {
      revealRef.current = revealProgress;
    } else {
      const target = visible ? 0 : 1;
      revealRef.current = THREE.MathUtils.lerp(
        revealRef.current,
        target,
        1 - Math.exp(-revealSpeed * delta)
      );
      if ( visible && revealRef.current < 0.005) revealRef.current = 0;
      if (!visible && revealRef.current > 0.995) revealRef.current = 1;
    }

    materialRef.current.uniforms.uReveal.value = revealRef.current;
    materialRef.current.visible = revealRef.current < 1;

    // --- Update Projectiles ---
    if (projectiles.length > 0) {
      const finishedProj: Projectile[] = [];
      const activeProj = projectiles.map((p) => {
        const nextProgress = p.progress + delta * p.speed;
        if (nextProgress >= 1.0) {
          finishedProj.push(p);
        }
        return { ...p, progress: Math.min(1.0, nextProgress) };
      });

      // Handle impacts of completed projectiles
      finishedProj.forEach((p) => {
        // Play impact boom
        playShieldImpact();

        // Trigger shield hex ripple in shader uniforms
        const idx = hitIdxRef.current % MAX_HITS;
        hitIdxRef.current++;
        const u = materialRef.current.uniforms;
        u.uHitPos.value[idx].copy(p.localTarget);
        u.uHitTime.value[idx] = timeRef.current;

        // Apply health damage (Plasma deals massive damage, EMP is tactical and low damage)
        let finalDamage = hitDamageRef.current;
        if (p.type === "PLASMA_BLAST") finalDamage *= 2.2;
        else if (p.type === "EMP_PULSE") finalDamage *= 0.5;

        lifeRef.current = Math.max(0, lifeRef.current - finalDamage / 100);

        // Spawn explosive debris particles flying outward from impact point
        const shieldNormal = p.target.clone().normalize();
        
        let count = 16;
        let pBurstColor = color;
        let pVelocityMult = 3.5;
        let pMinSize = 0.03;
        let pMaxSize = 0.07;

        if (p.type === "PLASMA_BLAST") {
          count = 28;
          pBurstColor = "#00f5ff";
          pVelocityMult = 4.2;
          pMinSize = 0.06;
          pMaxSize = 0.15; // huge splash
        } else if (p.type === "EMP_PULSE") {
          count = 14;
          pBurstColor = "#d500f9";
          pVelocityMult = 6.0; // very fast dispersal
          pMinSize = 0.02;
          pMaxSize = 0.05; // tiny high speed sparks
        }

        const burst = Array.from({ length: count }).map(() => {
          const velocity = new THREE.Vector3(
            (Math.random() - 0.5) * pVelocityMult,
            (Math.random() - 0.5) * pVelocityMult,
            (Math.random() - 0.5) * pVelocityMult
          ).addScaledVector(shieldNormal, pVelocityMult);
          
          return {
            id: Math.random(),
            pos: p.target.clone(),
            velocity,
            age: 0,
            size: pMinSize + Math.random() * (pMaxSize - pMinSize),
            color: pBurstColor
          };
        });

        setParticles((prev) => [...prev, ...burst]);
      });

      // Filter out completed ones from active state
      setProjectiles(activeProj.filter((p) => p.progress < 1.0));
    }

    // --- Update Particles ---
    if (particles.length > 0) {
      const activeParticles = particles
        .map((p) => {
          const newPos = p.pos.clone().addScaledVector(p.velocity, delta);
          p.velocity.multiplyScalar(1 - delta * 1.6); // deceleration resistance
          return {
            ...p,
            pos: newPos,
            age: p.age + delta * 2.3, // fade timer
          };
        })
        .filter((p) => p.age < 1.0);

      setParticles(activeParticles);
    }
  });

  return (
    <group ref={groupRef} position={[posX, posYOverride ?? posY, posZ]} scale={[scale, scale, scale]}>
      {/* Target Shield Sphere Mesh */}
      <mesh onClick={handleClick}>
        <sphereGeometry args={[1.8, 64, 64]} />
        <primitive object={shieldMaterial} attach="material" />
      </mesh>

      {/* Render Projectiles (Laser Bolts / Plasma Orbs / EMP Sparks) */}
      {projectiles.map((p) => {
        const currentPos = new THREE.Vector3().lerpVectors(p.start, p.target, p.progress);
        const localPos = groupRef.current ? groupRef.current.worldToLocal(currentPos.clone()) : currentPos;
        return (
          <mesh key={p.id} position={localPos}>
            <sphereGeometry args={[p.size, 12, 12]} />
            <meshBasicMaterial color={p.color} toneMapped={false} />
          </mesh>
        );
      })}

      {/* Render Explosion Particles */}
      {particles.map((p) => {
        const localPos = groupRef.current ? groupRef.current.worldToLocal(p.pos.clone()) : p.pos;
        return (
          <mesh key={p.id} position={localPos}>
            <sphereGeometry args={[p.size, 6, 6]} />
            <meshBasicMaterial
              color={p.color}
              opacity={1.0 - p.age}
              transparent
              toneMapped={false}
            />
          </mesh>
        );
      })}
    </group>
  );
}

export default Shield;
