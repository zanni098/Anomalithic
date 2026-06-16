"use client";

import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
}

// Abnormal-stone silhouette (unit coords, scaled to the canvas center).
const STONE = [
  [-0.5, -0.92],
  [0.45, -0.82],
  [1, 0.05],
  [0.58, 1],
  [-0.62, 0.86],
  [-1, -0.05],
  [-0.95, -0.6],
];

export function ParticleField() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mouse = { x: -9999, y: -9999, active: false };
    let particles: Particle[] = [];
    let w = 0;
    let h = 0;
    let raf = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(Math.floor((w * h) / 16000), 130);
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2,
        r: Math.random() * 1.5 + 0.4,
      }));
    };

    const drawStone = () => {
      const cx = w * 0.5;
      const cy = h * 0.5;
      const s = Math.min(w, h) * 0.2;
      ctx.beginPath();
      STONE.forEach(([px, py], i) => {
        const x = cx + (px ?? 0) * s;
        const y = cy + (py ?? 0) * s;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.strokeStyle = "rgba(184,80,45,0.35)";
      ctx.lineWidth = 1.2;
      ctx.stroke();
      // a couple of facet lines from an off-center point
      const fx = cx - s * 0.25;
      const fy = cy - s * 0.35;
      ctx.strokeStyle = "rgba(33,31,26,0.16)";
      ctx.lineWidth = 0.8;
      for (const [px, py] of [STONE[0], STONE[2], STONE[4]]) {
        if (!px && px !== 0) continue;
        ctx.beginPath();
        ctx.moveTo(fx, fy);
        ctx.lineTo(cx + (px ?? 0) * s, cy + (py ?? 0) * s);
        ctx.stroke();
      }
    };

    const draw = () => {
      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(33,31,26,0.42)";
        ctx.fill();
      }
      for (let i = 0; i < particles.length; i += 1) {
        const a = particles[i];
        if (!a) continue;
        for (let j = i + 1; j < particles.length; j += 1) {
          const b = particles[j];
          if (!b) continue;
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist2 = dx * dx + dy * dy;
          if (dist2 < 112 * 112) {
            const o = (1 - Math.sqrt(dist2) / 112) * 0.12;
            ctx.strokeStyle = `rgba(33,31,26,${o})`;
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }
    };

    const step = () => {
      ctx.clearRect(0, 0, w, h);
      drawStone();
      for (const p of particles) {
        if (mouse.active) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const dist2 = dx * dx + dy * dy;
          if (dist2 < 120 * 120 && dist2 > 0.01) {
            const d = Math.sqrt(dist2);
            const force = (1 - d / 120) * 0.5;
            p.vx += (dx / d) * force;
            p.vy += (dy / d) * force;
          }
        }
        p.x += p.vx;
        p.y += p.vy;
        p.vx = p.vx * 0.98 + (Math.random() - 0.5) * 0.008;
        p.vy = p.vy * 0.98 + (Math.random() - 0.5) * 0.008;
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10;
        if (p.y > h + 10) p.y = -10;
      }
      draw();
      raf = requestAnimationFrame(step);
    };

    resize();
    if (reduce) {
      ctx.clearRect(0, 0, w, h);
      drawStone();
      draw();
    } else {
      raf = requestAnimationFrame(step);
    }

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.active = true;
    };
    const onLeave = () => {
      mouse.active = false;
      mouse.x = -9999;
      mouse.y = -9999;
    };

    window.addEventListener("resize", resize);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return <canvas ref={ref} className="hero-canvas" aria-hidden="true" />;
}
