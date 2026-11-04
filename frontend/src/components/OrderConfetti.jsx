/**
 * MIT License
 *
 * Copyright (c) 2026 Chandu Cafeteria Application
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 * ---
 * Module:      OrderConfetti
 * Description: Fires a brand-colored confetti burst on order confirmation.
 *              Uses the lightweight canvas-confetti library (~6 kB gzipped).
 * Usage:       import { fireOrderConfetti } from "./OrderConfetti";
 *              fireOrderConfetti(); // call inside your order-success handler
 * Dependencies: canvas-confetti (npm install canvas-confetti)
 */

import confetti from "canvas-confetti";

const KPIT_GREEN = "#B0FF45";
const KPIT_PURPLE = "#753DFF";
const WHITE = "#FFFFFF";

/**
 * Fire a burst of KPIT-branded confetti (green + purple + white).
 * Designed for a ~2.5-second celebration.
 */
export function fireOrderConfetti() {
  // Left-side burst
  confetti({
    particleCount: 60,
    spread: 55,
    angle: 60,
    origin: { x: 0, y: 0.6 },
    colors: [KPIT_GREEN, KPIT_PURPLE, WHITE],
    startVelocity: 45,
    decay: 0.9,
    ticks: 200,
  });

  // Right-side burst (slightly delayed for asymmetrical feel)
  setTimeout(() => {
    confetti({
      particleCount: 60,
      spread: 55,
      angle: 120,
      origin: { x: 1, y: 0.6 },
      colors: [KPIT_GREEN, KPIT_PURPLE, WHITE],
      startVelocity: 45,
      decay: 0.9,
      ticks: 200,
    });
  }, 120);

  // Center shower (heavier, rains down)
  setTimeout(() => {
    confetti({
      particleCount: 80,
      spread: 100,
      origin: { x: 0.5, y: 0.3 },
      colors: [KPIT_GREEN, KPIT_PURPLE, WHITE],
      startVelocity: 35,
      decay: 0.92,
      ticks: 250,
      scalar: 0.9,
    });
  }, 250);
}

/**
 * Smaller, faster burst for quick acknowledgment (e.g., "Added to cart").
 */
export function fireQuickBurst() {
  confetti({
    particleCount: 25,
    spread: 40,
    origin: { x: 0.5, y: 0.7 },
    colors: [KPIT_GREEN, KPIT_PURPLE],
    startVelocity: 30,
    decay: 0.85,
    ticks: 100,
  });
}

/**
 * Side-to-side sweeping shot for large celebrations.
 */
export function fireGrandFinale() {
  const duration = 2000;
  const end = Date.now() + duration;

  const frame = () => {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 70,
      origin: { x: 0, y: 0.5 },
      colors: [KPIT_GREEN, KPIT_PURPLE, WHITE],
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 70,
      origin: { x: 1, y: 0.5 },
      colors: [KPIT_GREEN, KPIT_PURPLE, WHITE],
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  };

  frame();
}