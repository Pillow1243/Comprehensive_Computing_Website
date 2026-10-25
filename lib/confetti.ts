/**
 * Tiny canvas confetti burst (v4.1) — no dependency, brand-token colours,
 * `prefers-reduced-motion` aware. Fire-and-forget: the canvas cleans itself up.
 */

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  angle: number;
  spin: number;
  color: string;
  circle: boolean;
}

const FALLBACK_COLORS = ['#8B7CFF', '#C484FF', '#2DD4E8', '#FFCE8A'];

const brandColors = (): string[] => {
  try {
    const styles = getComputedStyle(document.documentElement);
    const read = (name: string) => {
      const triplet = styles.getPropertyValue(name).trim();
      return triplet ? `rgb(${triplet.split(/\s+/).join(',')})` : '';
    };
    const colors = ['--brand-a', '--brand-b', '--brand-c', '--md-secondary'].map(read).filter(Boolean);
    return colors.length ? colors : FALLBACK_COLORS;
  } catch {
    return FALLBACK_COLORS;
  }
};

export function burstConfetti(): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText =
    'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:95;';
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.floor(window.innerWidth * dpr);
  canvas.height = Math.floor(window.innerHeight * dpr);
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    canvas.remove();
    return;
  }
  ctx.scale(dpr, dpr);

  const colors = brandColors();
  const originX = window.innerWidth / 2;
  const originY = window.innerHeight * 0.32;
  const particles: Particle[] = Array.from({ length: 110 }, (_, index) => {
    const angle = (Math.PI * 2 * index) / 110 + Math.random() * 0.6;
    const speed = 3.2 + Math.random() * 6.5;
    return {
      x: originX,
      y: originY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 4.5,
      size: 4 + Math.random() * 5,
      angle: Math.random() * Math.PI,
      spin: (Math.random() - 0.5) * 0.3,
      color: colors[index % colors.length],
      circle: Math.random() > 0.55,
    };
  });

  const started = performance.now();
  const DURATION = 1600;

  const frame = (now: number) => {
    const elapsed = now - started;
    const fade = Math.max(0, 1 - elapsed / DURATION);
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    for (const particle of particles) {
      particle.vy += 0.16; // gravity
      particle.vx *= 0.992; // drag
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.angle += particle.spin;
      ctx.save();
      ctx.translate(particle.x, particle.y);
      ctx.rotate(particle.angle);
      ctx.globalAlpha = fade;
      ctx.fillStyle = particle.color;
      if (particle.circle) {
        ctx.beginPath();
        ctx.arc(0, 0, particle.size / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(-particle.size / 2, -particle.size / 4, particle.size, particle.size / 2);
      }
      ctx.restore();
    }
    if (elapsed < DURATION) requestAnimationFrame(frame);
    else canvas.remove();
  };
  requestAnimationFrame(frame);
}
