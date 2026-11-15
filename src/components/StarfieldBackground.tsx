import { useEffect, useRef } from 'react';

interface Star {
  x: number;
  y: number;
  radius: number;
  alpha: number;
  speed: number;
  phase: number;
}

export function StarfieldBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let animationId = 0;
    let stars: Star[] = [];

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.min(140, Math.floor((window.innerWidth * window.innerHeight) / 11000));
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        radius: 0.7 + Math.random() * 1.4,
        alpha: 0.25 + Math.random() * 0.65,
        speed: 0.4 + Math.random() * 1.2,
        phase: Math.random() * Math.PI * 2,
      }));
    };

    resize();
    window.addEventListener('resize', resize);

    let lastTime = performance.now();

    const draw = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      // Deep space subtle radial gradient wash
      const grad = ctx.createRadialGradient(
        window.innerWidth * 0.75,
        window.innerHeight * 0.2,
        40,
        window.innerWidth * 0.5,
        window.innerHeight * 0.5,
        window.innerWidth * 0.9
      );
      grad.addColorStop(0, 'rgba(30, 58, 138, 0.14)');
      grad.addColorStop(0.5, 'rgba(76, 29, 149, 0.06)');
      grad.addColorStop(1, 'rgba(7, 11, 25, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

      for (const s of stars) {
        if (!reducedMotion) {
          s.phase += dt * s.speed;
        }
        const twinkle = reducedMotion ? 1 : 0.6 + 0.4 * Math.sin(s.phase);
        ctx.fillStyle = `rgba(226, 232, 240, ${(s.alpha * twinkle).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      if (!reducedMotion) {
        animationId = requestAnimationFrame(draw);
      }
    };

    animationId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0"
    />
  );
}
