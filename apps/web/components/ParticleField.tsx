"use client";

import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/**
 * The hero centerpiece: a drifting constellation of particles around a glowing
 * "monolith". The cursor is a gravity well that pushes particles aside — the
 * "anomaly" that disturbs the monolith.
 */
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
      const count = Math.min(Math.floor((w * h) / 13000), 170);
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        r: Math.random() * 1.6 + 0.5,
      }));
    };

    const drawMonolith = () => {
      const mx = w * 0.5;
      const my = h * 0.52;
      const mw = Math.max(38, w * 0.045);
      const mh = Math.min(h * 0.62, 460);
      const grad = ctx.createLinearGradient(mx, my - mh / 2, mx, my + mh / 2);
      grad.addColorStop(0, "rgba(89,230,199,0)");
      grad.addColorStop(0.5, "rgba(89,230,199,0.10)");
      grad.addColorStop(1, "rgba(139,123,255,0)");
      ctx.fillStyle = grad;
      roundRect(ctx, mx - mw / 2, my - mh / 2, mw, mh, 10);
      ctx.fill();
      ctx.strokeStyle = "rgba(89,230,199,0.18)";
      ctx.lineWidth = 1;
      roundRect(ctx, mx - mw / 2, my - mh / 2, mw, mh, 10);
      ctx.stroke();
    };

    const drawParticles = () => {
      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(220,235,232,0.55)";
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
          if (dist2 < 120 * 120) {
            const opacity = (1 - Math.sqrt(dist2) / 120) * 0.18;
            ctx.strokeStyle = `rgba(89,230,199,${opacity})`;
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
      drawMonolith();
      for (const p of particles) {
        if (mouse.active) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const dist2 = dx * dx + dy * dy;
          if (dist2 < 130 * 130 && dist2 > 0.01) {
            const d = Math.sqrt(dist2);
            const force = (1 - d / 130) * 0.6;
            p.vx += (dx / d) * force;
            p.vy += (dy / d) * force;
          }
        }
        p.x += p.vx;
        p.y += p.vy;
        p.vx = p.vx * 0.98 + (Math.random() - 0.5) * 0.01;
        p.vy = p.vy * 0.98 + (Math.random() - 0.5) * 0.01;
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10;
        if (p.y > h + 10) p.y = -10;
      }
      drawParticles();
      raf = requestAnimationFrame(step);
    };

    resize();
    if (reduce) {
      ctx.clearRect(0, 0, w, h);
      drawMonolith();
      drawParticles();
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
