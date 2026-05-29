"use client";

import { useControls, folder } from "leva";
import { EffectComposer, Bloom, Noise, ChromaticAberration, Glitch } from "@react-three/postprocessing";
import { KernelSize, BlendFunction, GlitchMode } from "postprocessing";
import * as THREE from "three";
import { useEffect } from "react";

const BLEND_OPTIONS = [
  "OVERLAY",
  "SOFT_LIGHT",
  "SCREEN",
  "ADD",
  "NORMAL",
  "MULTIPLY",
  "COLOR_DODGE",
] as const;

type BlendOption = (typeof BLEND_OPTIONS)[number];

const BLEND_MAP: Record<BlendOption, BlendFunction> = {
  OVERLAY:     BlendFunction.OVERLAY,
  SOFT_LIGHT:  BlendFunction.SOFT_LIGHT,
  SCREEN:      BlendFunction.SCREEN,
  ADD:         BlendFunction.ADD,
  NORMAL:      BlendFunction.NORMAL,
  MULTIPLY:    BlendFunction.MULTIPLY,
  COLOR_DODGE: BlendFunction.COLOR_DODGE,
};

export default function PostProcessing() {
  const {
    bloomIntensity, luminanceThreshold, bloomRadius, mipmapBlur,
    noiseOpacity, noiseBlend, premultiply,
    glitchEnabled, chromaticEnabled, aberrationOffsetX, aberrationOffsetY,
    crtScanlinesEnabled, crtFlickerEnabled
  } = useControls("Post FX", {
    Bloom: folder(
      {
        bloomIntensity:     { value: 1.6,  min: 0,    max: 10, step: 0.1,  label: "Intensity"  },
        luminanceThreshold: { value: 0.10, min: 0,    max: 1,  step: 0.01, label: "Threshold"  },
        bloomRadius:        { value: 0.56, min: 0,    max: 1,  step: 0.01, label: "Radius"     },
        mipmapBlur:         { value: true,                                  label: "Mipmap Blur" },
      },
      { collapsed: true }
    ),
    Noise: folder(
      {
        noiseOpacity:  { value: 0.17, min: 0, max: 1, step: 0.01, label: "Opacity"     },
        noiseBlend:    { value: "OVERLAY" as BlendOption, options: [...BLEND_OPTIONS], label: "Blend Mode" },
        premultiply:   { value: false, label: "Premultiply" },
      },
      { collapsed: true }
    ),
    "Cyber Glitch": folder(
      {
        glitchEnabled: { value: false, label: "Glitch Enabled" },
      },
      { collapsed: true }
    ),
    "Chromatic Aberration": folder(
      {
        chromaticEnabled:  { value: false, label: "CA Enabled" },
        aberrationOffsetX: { value: 0.002, min: 0.0, max: 0.015, step: 0.0005, label: "Offset X" },
        aberrationOffsetY: { value: 0.002, min: 0.0, max: 0.015, step: 0.0005, label: "Offset Y" },
      },
      { collapsed: true }
    ),
    "CRT Overlay": folder(
      {
        crtScanlinesEnabled: { value: false, label: "CRT Scanlines" },
        crtFlickerEnabled:   { value: false, label: "Screen Flicker" },
      },
      { collapsed: true }
    )
  }, { collapsed: true });

  // DOM Side-effect to inject CRT vintage scanline divs overlaying the screen
  useEffect(() => {
    if (typeof window === "undefined") return;

    let scanlinesDiv: HTMLDivElement | null = null;
    let beamDiv: HTMLDivElement | null = null;

    if (crtScanlinesEnabled) {
      scanlinesDiv = document.createElement("div");
      scanlinesDiv.className = "crt-scanlines";
      if (crtFlickerEnabled) {
        scanlinesDiv.className += " crt-flicker";
      }
      document.body.appendChild(scanlinesDiv);

      beamDiv = document.createElement("div");
      beamDiv.className = "crt-scanline-beam";
      document.body.appendChild(beamDiv);
    }

    return () => {
      if (scanlinesDiv && scanlinesDiv.parentNode) {
        scanlinesDiv.parentNode.removeChild(scanlinesDiv);
      }
      if (beamDiv && beamDiv.parentNode) {
        beamDiv.parentNode.removeChild(beamDiv);
      }
    };
  }, [crtScanlinesEnabled, crtFlickerEnabled]);

  return (
    <EffectComposer
      multisampling={8}
      frameBufferType={THREE.HalfFloatType}
    >
      <Bloom
        intensity={bloomIntensity}
        luminanceThreshold={luminanceThreshold}
        radius={bloomRadius}
        mipmapBlur={mipmapBlur}
        kernelSize={KernelSize.LARGE}
      />
      <Noise
        premultiply={premultiply}
        blendFunction={BLEND_MAP[noiseBlend as BlendOption]}
        opacity={noiseOpacity}
      />
      <ChromaticAberration
        active={chromaticEnabled}
        offset={new THREE.Vector2(aberrationOffsetX, aberrationOffsetY)}
      />
      <Glitch
        active={glitchEnabled}
        delay={new THREE.Vector2(1.5, 3.5)}
        duration={new THREE.Vector2(0.2, 0.8)}
        strength={new THREE.Vector2(0.1, 0.3)}
        mode={GlitchMode.SPORADIC}
      />
    </EffectComposer>
  );
}
