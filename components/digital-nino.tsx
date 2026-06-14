'use client';

import React, { useRef, useEffect, useState } from 'react';

export type DigitalNinoMood = 'normal' | 'shocked' | 'happy';

interface Dot {
  col: number;
  row: number;
  type?: 'on' | 'eye' | 'mouth' | 'accent';
  tier?: number;
}

// Dot-matrix sprite (cols/rows around a center origin).
const SPRITE_DOTS: Dot[] = [
  // Antennae (red accent)
  { col: -1, row: -7, type: 'accent' },
  { col: 1, row: -7, type: 'accent' },
  { col: -1, row: -6, type: 'accent' },
  { col: 1, row: -6, type: 'accent' },
  // Head outline
  { col: -2, row: -5 }, { col: -1, row: -5 }, { col: 0, row: -5 }, { col: 1, row: -5 }, { col: 2, row: -5 },
  { col: -3, row: -4 }, { col: 3, row: -4 },
  { col: -3, row: -3 }, { col: 3, row: -3 },
  { col: -3, row: -2 }, { col: 3, row: -2 },
  { col: -3, row: -1 }, { col: 3, row: -1 },
  { col: -3, row: 0 }, { col: 3, row: 0 },
  { col: -2, row: 1 }, { col: -1, row: 1 }, { col: 0, row: 1 }, { col: 1, row: 1 }, { col: 2, row: 1 },
  // Eyes
  { col: -1, row: -3, type: 'eye' }, { col: -1, row: -2, type: 'eye' },
  { col: 1, row: -3, type: 'eye' }, { col: 1, row: -2, type: 'eye' },
  // Mouth
  { col: 0, row: 0, type: 'mouth' },
  // Neck
  { col: 0, row: 2 },
  // Body outline
  { col: -2, row: 3 }, { col: -1, row: 3 }, { col: 0, row: 3 }, { col: 1, row: 3 }, { col: 2, row: 3 },
  { col: -3, row: 4 }, { col: 3, row: 4 },
  { col: -2, row: 5 }, { col: -1, row: 5 }, { col: 0, row: 5 }, { col: 1, row: 5 }, { col: 2, row: 5 },
  // Arms
  { col: -4, row: 3 }, { col: -4, row: 4 },
  { col: 4, row: 3 }, { col: 4, row: 4 },
  // Feet
  { col: -2, row: 6 }, { col: -1, row: 6 },
  { col: 1, row: 6 }, { col: 2, row: 6 },
];

const ACCENT = '#d71921';

interface DigitalNinoProps {
  size?: number;
  mood?: DigitalNinoMood;
  isTalking?: boolean;
  /** 'dark' = light dots on dark bg, 'light' = dark dots on light bg */
  theme?: 'dark' | 'light';
}

// Canvas is wider/taller than the sprite so spins and hops are never cropped.
const CANVAS_W_RATIO = 2.0;
const CANVAS_H_RATIO = 2.4;

export const DigitalNino: React.FC<DigitalNinoProps> = ({
  size = 120,
  mood = 'normal',
  isTalking = false,
  theme = 'dark',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tapProgress, setTapProgress] = useState<number | null>(null);
  const animationFrameRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const tapStartTimeRef = useRef<number | null>(null);

  const handleTap = () => {
    if (tapProgress === null) {
      tapStartTimeRef.current = performance.now();
      setTapProgress(0);
    }
  };

  useEffect(() => {
    startTimeRef.current = performance.now();

    const loop = (timestamp: number) => {
      const elapsed = timestamp - startTimeRef.current;
      const phase = (elapsed % 3000) / 3000;

      let currentTapVal: number | null = null;
      if (tapStartTimeRef.current !== null) {
        const tapElapsed = timestamp - tapStartTimeRef.current;
        if (tapElapsed >= 600) {
          tapStartTimeRef.current = null;
          setTapProgress(null);
        } else {
          currentTapVal = tapElapsed / 600;
          setTapProgress(currentTapVal);
        }
      }

      draw(phase, currentTapVal);
      animationFrameRef.current = requestAnimationFrame(loop);
    };

    const draw = (phase: number, tapValue: number | null) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const width = size * CANVAS_W_RATIO;
      const height = size * CANVAS_H_RATIO;

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      const u = size / 11.0;
      const pitch = u * 1.4;
      const ox = width / 2;
      const oy = height / 2;

      let floatY = 0;
      let floatX = 0;

      if (mood === 'happy') {
        floatY = -Math.abs(Math.sin(phase * 8 * Math.PI)) * u * 0.8;
      } else if (mood === 'shocked') {
        floatY = Math.sin(phase * 2 * Math.PI) * u * 0.3;
        floatX = Math.sin(phase * 16 * Math.PI) * u * 0.35;
      } else {
        floatY = Math.sin(phase * 2 * Math.PI) * u * 0.45;
      }

      const blinkWindow = (p: number, start: number) => {
        if (p >= start && p < start + 0.05) {
          const t = (p - start) / 0.05;
          const v = t < 0.5 ? t * 2 : (1.0 - t) * 2;
          return 0.15 + (1.0 - Math.min(Math.max(v, 0.0), 1.0)) * 0.85;
        }
        return 1.0;
      };

      const bA = blinkWindow(phase, 0.12);
      const bB = blinkWindow(phase, 0.68);
      const blinkScale = bA < 1.0 ? bA : bB < 1.0 ? bB : 1.0;

      let leftBlink = blinkScale;
      let rightBlink = blinkScale;
      const isTapped = tapValue !== null;

      if (isTapped && tapValue > 0.15 && tapValue < 0.85 && mood === 'normal') {
        leftBlink = 0.15;
        rightBlink = 1.0;
      }

      const talkScale = isTalking
        ? 0.3 + 0.7 * Math.abs(Math.sin(phase * 10 * Math.PI))
        : mood === 'shocked'
        ? 0.75
        : 0.2;

      let rotateAngle = 0;
      let hopY = 0;
      let scaleX = 1.0;
      let scaleY = 1.0;

      if (isTapped) {
        const t = tapValue;
        if (mood === 'happy') {
          hopY = -Math.abs(Math.sin(t * 2 * Math.PI)) * 20.0;
          scaleX = 1.0 + 0.15 * Math.sin(t * 4 * Math.PI);
          scaleY = 1.0 - 0.15 * Math.sin(t * 4 * Math.PI);
        } else if (mood === 'shocked') {
          scaleX = 1.0 - 0.25 * Math.sin(t * Math.PI);
          scaleY = 1.0 - 0.25 * Math.sin(t * Math.PI);
          rotateAngle = Math.sin(t * 8 * Math.PI) * 0.15;
        } else {
          rotateAngle = t * 2 * Math.PI;
          hopY = t < 0.5
            ? (1.0 - Math.pow(1.0 - t * 2, 2)) * -16.0
            : -16.0 + Math.pow((t - 0.5) * 2, 2) * 16.0;
        }
      }

      ctx.translate(ox, oy + hopY);
      ctx.rotate(rotateAngle);
      ctx.scale(scaleX, scaleY);
      ctx.translate(-ox, -oy - hopY);

      // Faint background grid
      ctx.fillStyle = theme === 'dark'
        ? 'rgba(215, 25, 33, 0.10)'
        : 'rgba(120, 120, 120, 0.18)';
      for (let r = -8; r <= 8; r++) {
        for (let c = -6; c <= 6; c++) {
          ctx.beginPath();
          ctx.arc(ox + c * pitch + floatX, oy + r * pitch + floatY + hopY, u * 0.05, 0, 2 * Math.PI);
          ctx.fill();
        }
      }

      const dotColor = theme === 'dark' ? '#f5f5f5' : '#0a0a0a';

      const drawDot = (cx: number, cy: number, color: string, mult = 0.45) => {
        const s = u * mult;
        const r = u * 0.1;
        ctx.fillStyle = color;
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(cx - s / 2, cy - s / 2, s, s, r);
        } else {
          ctx.rect(cx - s / 2, cy - s / 2, s, s);
        }
        ctx.fill();
      };

      for (const d of SPRITE_DOTS) {
        const cx = ox + d.col * pitch + floatX;
        const cy = oy + d.row * pitch + floatY + hopY;

        switch (d.type) {
          case 'eye':
            ctx.save();
            ctx.translate(cx, cy);
            ctx.scale(1.0, d.col < 0 ? leftBlink : rightBlink);
            ctx.translate(-cx, -cy);
            drawDot(cx, cy, dotColor);
            ctx.restore();
            break;

          case 'mouth':
            ctx.save();
            ctx.translate(cx, cy);
            ctx.scale(1.0, talkScale);
            ctx.translate(-cx, -cy);
            drawDot(cx, cy, ACCENT, 0.4);
            ctx.restore();
            break;

          case 'accent':
            drawDot(cx, cy, ACCENT);
            break;

          default:
            drawDot(cx, cy, dotColor);
            break;
        }
      }

      ctx.restore();
    };

    animationFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameRef.current);
  }, [mood, isTalking, size, tapProgress, theme]);

  return (
    <div
      className="inline-block cursor-pointer select-none"
      onClick={handleTap}
      style={{ width: size * CANVAS_W_RATIO, height: size * CANVAS_H_RATIO }}
    >
      <canvas ref={canvasRef} />
    </div>
  );
};
