"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

type ThreeHeadViewerProps = {
  colour?: string;
  texture?: string;
};

export function ThreeHeadViewer({ colour = "1A Naturschwarz", texture = "Wellig" }: ThreeHeadViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(0, 0, 4);

    const group = new THREE.Group();
    scene.add(group);

    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.82, 48, 48).scale(0.86, 1.18, 0.78),
      new THREE.MeshStandardMaterial({ color: 0xcaa883, roughness: 0.7 })
    );
    head.position.y = -0.12;
    group.add(head);

    const hairColor = colour.toLowerCase().includes("613") || colour.toLowerCase().includes("blond")
      ? 0xd8c08b
      : colour.toLowerCase().includes("braun") || colour.toLowerCase().includes("brown")
      ? 0x4a2d1c
      : 0x15100d;

    const cap = new THREE.Mesh(
      new THREE.SphereGeometry(0.92, 48, 24, 0, Math.PI * 2, 0, Math.PI * 0.62).scale(0.9, 1.05, 0.82),
      new THREE.MeshStandardMaterial({ color: hairColor, roughness: 0.55, side: THREE.DoubleSide })
    );
    cap.position.y = 0.22;
    group.add(cap);

    const length = texture.toLowerCase().includes("glatt") ? 1.35 : 1.12;
    const leftFall = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.18, length, 12, 24),
      new THREE.MeshStandardMaterial({ color: hairColor, roughness: 0.6 })
    );
    leftFall.position.set(-0.72, -0.45, 0.08);
    leftFall.rotation.z = 0.14;
    group.add(leftFall);

    const rightFall = leftFall.clone();
    rightFall.position.x = 0.72;
    rightFall.rotation.z = -0.14;
    group.add(rightFall);

    const ambient = new THREE.AmbientLight(0xffffff, 0.72);
    scene.add(ambient);
    const key = new THREE.DirectionalLight(0xf1d19a, 1.1);
    key.position.set(3, 4, 4);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xffffff, 0.45);
    fill.position.set(-3, 2, 2);
    scene.add(fill);

    const resize = () => {
      const width = canvas.clientWidth || 420;
      const height = canvas.clientHeight || width;
      renderer.setSize(width, height, false);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    resize();
    window.addEventListener("resize", resize);

    let frame = 0;
    const animate = () => {
      frame = requestAnimationFrame(animate);
      group.rotation.y += 0.006;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      renderer.dispose();
      scene.traverse((obj: THREE.Object3D) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) obj.material.forEach((mat: THREE.Material) => mat.dispose());
          else obj.material.dispose();
        }
      });
    };
  }, [colour, texture]);

  return <canvas ref={canvasRef} aria-label="3D HairMatch head visualisation" />;
}
