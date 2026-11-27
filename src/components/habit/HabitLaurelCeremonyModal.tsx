import React, { useEffect, useRef } from 'react';
import { Button } from '../ui/Button';
import { triggerHaptic } from '../../utils/haptics';

export interface LaurelHabitData {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  completedChecks: number;
  streakCount: number;
  completionRate: number;
}

interface HabitLaurelCeremonyModalProps {
  isOpen: boolean;
  onClose: () => void;
  monthTitle: string;
  boardName: string;
  laurelHabit: LaurelHabitData | null;
  onOpenShareModal?: () => void;
}

export const HabitLaurelCeremonyModal: React.FC<HabitLaurelCeremonyModalProps> = ({
  isOpen,
  onClose,
  monthTitle,
  boardName,
  laurelHabit,
  onOpenShareModal,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Trigger milestone haptic feedback on modal opening
  useEffect(() => {
    if (isOpen) {
      triggerHaptic('milestone');
    }
  }, [isOpen]);

  // Leaf-Flutter micro-particles simulation on canvas
  useEffect(() => {
    if (!isOpen) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Leaf particle definition
    interface LeafParticle {
      x: number;
      y: number;
      size: number;
      speedY: number;
      speedX: number;
      angle: number;
      angularSpeed: number;
      color: string;
      swayAmplitude: number;
      swayFrequency: number;
      swayOffset: number;
    }

    const leafColors = [
      'rgba(82, 153, 93, 0.75)', // Sage Green
      'rgba(45, 90, 52, 0.75)',  // Deep Forest Green
      'rgba(212, 163, 115, 0.7)', // Warm Terracotta Ochre
      'rgba(136, 196, 144, 0.8)', // Spring Jade
      'rgba(245, 208, 110, 0.7)', // Golden Laurel
    ];

    const particleCount = 38;
    const particles: LeafParticle[] = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * -height * 0.8,
        size: 8 + Math.random() * 12,
        speedY: 1.2 + Math.random() * 1.8,
        speedX: (Math.random() - 0.5) * 0.8,
        angle: Math.random() * Math.PI * 2,
        angularSpeed: (Math.random() - 0.5) * 0.04,
        color: leafColors[Math.floor(Math.random() * leafColors.length)],
        swayAmplitude: 15 + Math.random() * 25,
        swayFrequency: 0.01 + Math.random() * 0.02,
        swayOffset: Math.random() * Math.PI * 2,
      });
    }

    let frame = 0;
    const render = () => {
      frame++;
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.y += p.speedY;
        p.angle += p.angularSpeed;
        const sway = Math.sin(frame * p.swayFrequency + p.swayOffset) * 0.75;
        p.x += p.speedX + sway;

        // Reset if off bottom
        if (p.y > height + 20) {
          p.y = -20;
          p.x = Math.random() * width;
        }

        // Draw botanical leaf shape
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);

        ctx.fillStyle = p.color;
        ctx.beginPath();
        // Delicate curved almond leaf
        ctx.ellipse(0, 0, p.size * 0.45, p.size, 0, 0, Math.PI * 2);
        ctx.fill();

        // Subtle leaf center vein
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, -p.size * 0.8);
        ctx.lineTo(0, p.size * 0.8);
        ctx.stroke();

        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-label="End-of-Month Habit Laurel Ceremony"
      onClick={onClose}
    >
      {/* Background Falling Leaf Particles Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none z-10"
      />

      {/* Modal Dialog Content */}
      <div
        className="japandi-card relative z-20 w-full max-w-lg bg-surface-container-lowest dark:bg-stone-900 rounded-3xl border border-amber-500/30 shadow-2xl p-6 sm:p-8 space-y-6 text-center animate-scaleUp overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Warm Ambient Laurel Glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full bg-amber-500/15 dark:bg-amber-400/15 blur-3xl pointer-events-none" />

        {/* Top Close Button */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic('tick');
            onClose();
          }}
          className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors cursor-pointer"
          aria-label="Close ceremony modal"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>

        {/* Laurel Wreath Icon & Crown */}
        <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-amber-400/20 via-emerald-500/20 to-teal-500/20 border border-amber-400/40 flex items-center justify-center shadow-lg relative animate-pulse">
          <span className="text-4xl">👑</span>
          <span className="absolute -top-1 -right-1 text-xl">🌿</span>
          <span className="absolute -bottom-1 -left-1 text-xl">🌿</span>
        </div>

        {/* Ceremony Header */}
        <div className="space-y-1">
          <span className="text-[10px] uppercase font-mono font-bold tracking-widest px-3 py-1 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
            {monthTitle} Laurel Ceremony
          </span>
          <h2 className="font-app-title text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight pt-2">
            Most Resilient Habit
          </h2>
          <p className="font-body-text text-xs text-on-surface-variant">
            Honoring consistency that withstood cognitive friction in {boardName}
          </p>
        </div>

        {/* Laurel Winner Habit Card */}
        {laurelHabit ? (
          <div className="p-4 sm:p-5 rounded-2xl bg-surface-container-low dark:bg-stone-800/80 border border-outline-variant/30 text-left space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <span
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 shadow-xs"
                  style={{ backgroundColor: `${laurelHabit.color || '#2D5A34'}25` }}
                >
                  {laurelHabit.icon || '🌱'}
                </span>
                <div>
                  <h3 className="font-app-title font-bold text-base sm:text-lg text-on-surface">
                    {laurelHabit.name}
                  </h3>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold font-mono">
                    Laurel Champion
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="font-mono text-2xl font-black text-primary font-tnum">
                  {laurelHabit.completionRate}%
                </span>
                <span className="block text-[10px] text-on-surface-variant uppercase font-bold">
                  Consistency
                </span>
              </div>
            </div>

            {/* Metric Pills */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-outline-variant/20 text-center">
              <div className="p-2 rounded-xl bg-surface-container dark:bg-stone-800">
                <span className="text-[10px] text-on-surface-variant uppercase font-bold block">
                  Total Completed Checks
                </span>
                <span className="font-mono font-bold text-sm text-on-surface font-tnum">
                  {laurelHabit.completedChecks} days ✅
                </span>
              </div>
              <div className="p-2 rounded-xl bg-surface-container dark:bg-stone-800">
                <span className="text-[10px] text-on-surface-variant uppercase font-bold block">
                  Longest Unbroken Streak
                </span>
                <span className="font-mono font-bold text-sm text-primary font-tnum">
                  {laurelHabit.streakCount} days 🔥
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-surface-container text-xs text-on-surface-variant">
            No tracked habits logged yet for {monthTitle}.
          </div>
        )}

        {/* UCL Neurobiological Scientific Quote */}
        <div className="p-3.5 rounded-2xl bg-primary/10 border border-primary/20 text-xs text-primary leading-relaxed">
          <p className="font-editorial italic">
            "Automaticity is formed through reps, not days. By preserving momentum, you have laid permanent neural scaffolding."
          </p>
          <span className="block text-[9.5px] font-mono text-on-surface-variant/80 mt-1">
            — UCL Habit Formation Plateau Principle
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 pt-1">
          {onOpenShareModal && (
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                triggerHaptic('selection');
                onClose();
                onOpenShareModal();
              }}
              className="flex-1 flex items-center justify-center gap-2 rounded-2xl"
            >
              <span className="material-symbols-outlined text-[18px]">share</span>
              <span>Share Laurel Milestone</span>
            </Button>
          )}

          <Button
            variant="outline"
            size="md"
            onClick={() => {
              triggerHaptic('selection');
              onClose();
            }}
            className="flex-1 rounded-2xl"
          >
            Continue Flourishing
          </Button>
        </div>
      </div>
    </div>
  );
};
