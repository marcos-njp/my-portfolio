# Nihilita Design System & Web Extraction Guide

This document explains the fonts used in the **Nihilita** design system and provides a complete, production-ready React component (TypeScript) for Next.js to render the animated dot-matrix mascot, **Nihilita Glyph**.

---

## 1. The Fonts of Nihilita

Nihilita uses 4 distinct font families, each serving a unique design role inspired by the aesthetic of **Nothing Company**:

| Font Family | Filenames in Project | Role / Usage in App | Web Loading Strategy (Next.js) |
| :--- | :--- | :--- | :--- |
| **`Ndot55`** | `Ndot55-Regular.otf`<br>`Ndot-55.otf` | **App Name Hero Display**:<br>Large brand moments, uppercase dot-matrix headers (e.g. the word `"NIHILITA"`). | Load as a local font in Next.js via `next/font/local`. |
| **`LetteraMonoLL`** | `LetteraMonoLL-Light.otf`<br>`LetteraMonoLL-Regular.otf`<br>`LetteraMonoLL-Medium.otf` *(+ Italics)* | **UI Labels & Actions**:<br>Uppercase small labels, form field labels, buttons, navigation headers. | Load as a local font or substitute with a clean condensed monospace font. |
| **`NType82Regular`** | `NType82-Regular.otf`<br>`NType82-Headline.otf` | **Workhorse Body Copy**:<br>Readability-focused text, dropdown options, notes, general descriptions. | Load as a local font or fall back to high-quality sans-serif (e.g., *Inter* or *System Sans*). |
| **`NType82Mono`** | `NType82Mono-Regular.otf` | **Monospaced Numbers & Data**:<br>Aligns all numbers and amounts in columns perfectly. | Load as local font or fall back to standard monospaced fonts (e.g., *Space Mono*). |

---

## 2. The "Glyph Thing" (Nihilita Mascot)

The animated robot mascot is not an image or a video—it is a **9x15 dot-matrix sprite** drawn dynamically onto a grid. 
It supports multiple interactive states, moods, and micro-animations:
1. **Normal Mood**: Gentle floating up and down. Occasionally blinks eyes twice every 3 seconds. If tapped, it performs a 360-degree backflip jump and winks its left eye.
2. **Happy Mood** (e.g., saving money): Bouncy rapid jumping. Tapping causes it to double-bounce with a squash-and-stretch scale transition.
3. **Shocked Mood** (e.g., large expense): Horizontal shaking with static wide-open eyes ("O" mouth shape) and blushing cheeks. Tapping triggers a scared shrink and dizzy wobble.
4. **Dialogue state (`isTalking`)**: The mouth dot scales vertically in an oscillation to mimic talking speech.

---

## 3. Next.js React Component Implementation

Below is a complete, self-contained React TypeScript component. It renders the mascot onto a high-DPI crisp HTML5 `<canvas>` using the exact coordinates, physics formulas, and colors from the Flutter codebase.

### Font Setup in Next.js (`app/layout.tsx` or similar)

Copy the fonts from `assets/fonts/` into your Next.js project (e.g., `public/fonts/`). Then configure them in Next.js:

```typescript
import localFont from 'next/font/local';

export const ndot = localFont({
  src: '../public/fonts/Ndot55-Regular.otf',
  variable: '--font-ndot',
});

export const lettera = localFont({
  src: '../public/fonts/LetteraMonoLL-Regular.otf',
  variable: '--font-lettera',
});
```

### React Mascot Component: `NihilitaGlyph.tsx`

Save this file in your project (e.g., `/components/NihilitaGlyph.tsx`):

```tsx
'use client';

import React, { useRef, useEffect, useState } from 'react';

export type NihilitaMood = 'normal' | 'shocked' | 'happy';

interface Dot {
  col: number;
  row: number;
  type?: 'on' | 'eye' | 'blush' | 'mouth';
  tier?: number;
}

// Coordinates mapped exactly from Flutter's kSprite
const SPRITE_DOTS: Dot[] = [
  // Antennae
  { col: -1, row: -7, tier: 2 },
  { col: 1, row: -7, tier: 2 },
  { col: -1, row: -6, tier: 2 },
  { col: 1, row: -6, tier: 2 },

  // Head Outline
  { col: -2, row: -5 },
  { col: -1, row: -5 },
  { col: 0, row: -5 },
  { col: 1, row: -5 },
  { col: 2, row: -5 },

  { col: -3, row: -4 },
  { col: 3, row: -4 },
  { col: -3, row: -3 },
  { col: 3, row: -3 },
  { col: -3, row: -2 },
  { col: 3, row: -2 },
  { col: -3, row: -1 },
  { col: 3, row: -1 },
  { col: -3, row: 0 },
  { col: 3, row: 0 },

  { col: -2, row: 1 },
  { col: -1, row: 1 },
  { col: 0, row: 1 },
  { col: 1, row: 1 },
  { col: 2, row: 1 },

  // Eyes
  { col: -1, row: -3, type: 'eye' },
  { col: -1, row: -2, type: 'eye' },
  { col: 1, row: -3, type: 'eye' },
  { col: 1, row: -2, type: 'eye' },

  // Blush
  { col: -2, row: -2, type: 'blush' },
  { col: 2, row: -2, type: 'blush' },

  // Mouth
  { col: 0, row: 0, type: 'mouth' },

  // Neck
  { col: 0, row: 2, tier: 2 },

  // Body Outline
  { col: -2, row: 3, tier: 2 },
  { col: -1, row: 3, tier: 2 },
  { col: 0, row: 3, tier: 2 },
  { col: 1, row: 3, tier: 2 },
  { col: 2, row: 3, tier: 2 },

  { col: -3, row: 4, tier: 2 },
  { col: 3, row: 4, tier: 2 },

  { col: -2, row: 5, tier: 2 },
  { col: -1, row: 5, tier: 2 },
  { col: 0, row: 5, tier: 2 },
  { col: 1, row: 5, tier: 2 },
  { col: 2, row: 5, tier: 2 },

  // Arms
  { col: -4, row: 3, tier: 3 },
  { col: -4, row: 4, tier: 3 },
  { col: 4, row: 3, tier: 3 },
  { col: 4, row: 4, tier: 3 },

  // Feet
  { col: -2, row: 6, tier: 4 },
  { col: -1, row: 6, tier: 4 },
  { col: 1, row: 6, tier: 4 },
  { col: 2, row: 6, tier: 4 },
];

// Color palette constants matching the AppTheme
const COLORS = {
  accentWhite: '#FFFFFF',
  borderColor: '#2E2E2E',
  errorRed: '#FF4444',
  backgroundPrimary: '#0A0A0A',
};

interface NihilitaGlyphProps {
  size?: number; // Base width in pixels (height is calculated as size * 1.35)
  mood?: NihilitaMood;
  isTalking?: boolean;
}

export const NihilitaGlyph: React.FC<NihilitaGlyphProps> = ({
  size = 180,
  mood = 'normal',
  isTalking = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Animation track states
  const [tapProgress, setTapProgress] = useState<number | null>(null);
  const animationFrameRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const tapStartTimeRef = useRef<number | null>(null);

  // Trigger tap/click spin jump
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
      const phase = (elapsed % 3000) / 3000; // 3-second float/blink cycle

      // Handle tap animations (600ms duration)
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
      const width = size;
      const height = size * 1.35;

      // Adjust canvas resolution for High-DPI screens
      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      // Calculations matching Flutter physics
      const u = width / 11.0;
      const pitch = u * 1.35;
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

      // Blinks twice per cycle
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

      // Wink left eye on normal tap
      let leftBlink = blinkScale;
      let rightBlink = blinkScale;
      const isTapped = tapValue !== null;

      if (isTapped && tapValue > 0.15 && tapValue < 0.85 && mood === 'normal') {
        leftBlink = 0.15;
        rightBlink = 1.0;
      }

      // Mouth scaling for dialogue
      const talkScale = isTalking
        ? 0.3 + 0.7 * Math.abs(Math.sin(phase * 10 * Math.PI))
        : mood === 'shocked'
        ? 0.7
        : 0.25;

      // Transform physics based on interactive click states
      let rotateAngle = 0;
      let hopY = 0;
      let scaleX = 1.0;
      let scaleY = 1.0;

      if (isTapped) {
        const t = tapValue;
        if (mood === 'happy') {
          // Bouncy squish-and-stretch
          hopY = -Math.abs(Math.sin(t * 2 * Math.PI)) * 20.0;
          scaleX = 1.0 + 0.15 * Math.sin(t * 4 * Math.PI);
          scaleY = 1.0 - 0.15 * Math.sin(t * 4 * Math.PI);
        } else if (mood === 'shocked') {
          // Shrink and wobble
          scaleX = 1.0 - 0.25 * Math.sin(t * Math.PI);
          scaleY = 1.0 - 0.25 * Math.sin(t * Math.PI);
          rotateAngle = Math.sin(t * 8 * Math.PI) * 0.15;
        } else {
          // Backflip spin
          rotateAngle = t * 2 * Math.PI;
          // Interpolate standard parabolic leap
          if (t < 0.5) {
            const easeOut = 1.0 - Math.pow(1.0 - t * 2, 2);
            hopY = easeOut * -16.0;
          } else {
            const easeIn = Math.pow((t - 0.5) * 2, 2);
            hopY = -16.0 + easeIn * 16.0;
          }
        }
      }

      // Apply primary jumps & spins
      ctx.translate(ox, oy + hopY);
      ctx.rotate(rotateAngle);
      ctx.scale(scaleX, scaleY);
      ctx.translate(-ox, -oy - hopY);

      // 1. Draw background grid of tiny points
      ctx.fillStyle = 'rgba(46, 46, 46, 0.25)'; // border color with opacity
      for (let r = -8; r <= 7; r++) {
        for (let c = -5; c <= 5; c++) {
          ctx.beginPath();
          ctx.arc(
            ox + c * pitch + floatX,
            oy + r * pitch + floatY + hopY,
            u * 0.08,
            0,
            2 * Math.PI
          );
          ctx.fill();
        }
      }

      // Helper to draw rounded dot
      const drawDot = (cx: number, cy: number, color: string) => {
        const w = u * 0.78;
        const h = u * 0.78;
        const r = u * 0.22;
        ctx.fillStyle = color;
        ctx.beginPath();
        // Browser compatible rounded rectangles
        if (ctx.roundRect) {
          ctx.roundRect(cx - w / 2, cy - h / 2, w, h, r);
        } else {
          ctx.rect(cx - w / 2, cy - h / 2, w, h);
        }
        ctx.fill();
      };

      // 2. Draw sprite dots
      for (const d of SPRITE_DOTS) {
        const cx = ox + d.col * pitch + floatX;
        const cy = oy + d.row * pitch + floatY + hopY;

        switch (d.type) {
          case 'eye':
            ctx.save();
            ctx.translate(cx, cy);
            ctx.scale(1.0, d.col < 0 ? leftBlink : rightBlink);
            ctx.translate(-cx, -cy);
            drawDot(cx, cy, COLORS.accentWhite);
            ctx.restore();
            break;

          case 'mouth':
            ctx.save();
            ctx.translate(cx, cy);
            ctx.scale(1.0, talkScale);
            ctx.translate(-cx, -cy);
            drawDot(cx, cy, COLORS.accentWhite);
            ctx.restore();
            break;

          case 'blush': {
            const blushAlpha = mood === 'shocked' ? 0.8 : 0.65;
            drawDot(cx, cy, `rgba(255, 68, 68, ${blushAlpha})`);
            break;
          }

          default:
            drawDot(cx, cy, COLORS.accentWhite);
            break;
        }
      }

      ctx.restore();
    };

    animationFrameRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, [mood, isTalking, size, tapProgress]);

  return (
    <div 
      className="inline-block cursor-pointer select-none"
      onClick={handleTap}
      style={{ width: size, height: size * 1.35 }}
    >
      <canvas ref={canvasRef} />
    </div>
  );
};
```
