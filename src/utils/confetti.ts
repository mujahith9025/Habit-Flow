// Lightweight zero-dependency 60fps Canvas Confetti Engine

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  shape: 'rect' | 'circle';
}

const BRAND_COLORS = [
  '#006398', // Primary Deep Cyan / Blue
  '#286b33', // Secondary Forest Emerald
  '#f59e0b', // Amber / Golden
  '#10b981', // Mint Green
  '#6366f1', // Indigo / Purple
  '#ec4899', // Pink / Rose
  '#06b6d4', // Bright Cyan
];

export function triggerConfetti(options?: {
  particleCount?: number;
  origin?: { x: number; y: number };
  spread?: number;
}) {
  if (typeof window === 'undefined') return;

  const count = options?.particleCount || 75;
  const originX = options?.origin?.x ?? 0.5;
  const originY = options?.origin?.y ?? 0.6;
  const spread = options?.spread || 70;

  // Create or reuse full-screen canvas
  let canvas = document.getElementById('habitflow-confetti-canvas') as HTMLCanvasElement;
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = 'habitflow-confetti-canvas';
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '99999';
    document.body.appendChild(canvas);
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Set high-DPI canvas size
  const dpr = window.devicePixelRatio || 1;
  const width = window.innerWidth;
  const height = window.innerHeight;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.scale(dpr, dpr);

  const particles: Particle[] = [];

  for (let i = 0; i < count; i++) {
    const angle = (Math.PI / 180) * (270 + (Math.random() * spread - spread / 2));
    const speed = 7 + Math.random() * 9;

    particles.push({
      x: width * originX,
      y: height * originY,
      vx: Math.cos(angle) * speed + (Math.random() - 0.5) * 3,
      vy: Math.sin(angle) * speed,
      size: 6 + Math.random() * 6,
      color: BRAND_COLORS[Math.floor(Math.random() * BRAND_COLORS.length)],
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 12,
      opacity: 1,
      shape: Math.random() > 0.4 ? 'rect' : 'circle',
    });
  }

  function render() {
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, width, height);

    let activeParticles = 0;

    for (const p of particles) {
      if (p.opacity <= 0.01) continue;
      activeParticles++;

      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.28; // Gravity
      p.vx *= 0.98; // Air resistance
      p.rotation += p.rotationSpeed;
      p.opacity -= 0.014;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.globalAlpha = Math.max(0, p.opacity);
      ctx.fillStyle = p.color;

      if (p.shape === 'rect') {
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    if (activeParticles > 0) {
      requestAnimationFrame(render);
    } else {
      ctx.clearRect(0, 0, width, height);
      if (canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
      }
    }
  }

  requestAnimationFrame(render);
}

/**
 * Triggers full celebration burst from left & right corners
 */
export function triggerMilestoneCelebration() {
  triggerConfetti({ particleCount: 50, origin: { x: 0.2, y: 0.7 }, spread: 60 });
  setTimeout(() => {
    triggerConfetti({ particleCount: 50, origin: { x: 0.8, y: 0.7 }, spread: 60 });
  }, 180);
}
