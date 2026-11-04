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
 * Module:      CartIconPulse
 * Description: Floating cart icon that pulses on item-count change.
 * Usage:       <CartIconPulse count={cartCount} onClick={openCart} />
 * Dependencies: react, framer-motion
 */

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useAnimation } from "framer-motion";

export default function CartIconPulse({
  count = 0,
  total = 0,
  onClick,
  className = "",
}) {
  const controls = useAnimation();
  const prevCount = useRef(count);
  const [phase, setPhase] = useState("idle");
  const isMounted = useRef(false);

  useEffect(() => {
    isMounted.current = true;
  }, []);

  useEffect(() => {
    if (count > prevCount.current && prevCount.current >= 0 && isMounted.current) {
      setPhase("pulsing");
      controls.start({
        scale: [1, 1.15, 1.08, 1],
        transition: { duration: 0.35, ease: "easeOut" },
      });
      const timer = setTimeout(() => setPhase("idle"), 400);
      prevCount.current = count;
      return () => clearTimeout(timer);
    }
    prevCount.current = count;
  }, [count, controls]);

  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.button
          onClick={onClick}
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-6 py-3.5 bg-kpit-black text-white rounded-full shadow-2xl shadow-kpit-black/25 ${className}`}
          initial={{ y: 100, opacity: 0 }}
          animate={controls}
          exit={{ y: 100, opacity: 0 }}
          whileHover={{ scale: 1.04, y: -2 }}
          whileTap={{ scale: 0.96 }}
          transition={{ type: "spring", stiffness: 350, damping: 22, mass: 1.2 }}
        >
          <div className="relative">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            <motion.span
              className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-kpit-green-primary text-[10px] font-bold text-kpit-black flex items-center justify-center"
              key={count}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500 }}
            >
              {count}
            </motion.span>
          </div>
          <span className="font-bold text-sm">
            Place Order · ₹{total.toFixed(2)}
          </span>
          {phase === "pulsing" && (
            <motion.div
              className="absolute inset-0 rounded-full bg-kpit-green-primary/20"
              initial={{ scale: 1, opacity: 0.6 }}
              animate={{ scale: 1.6, opacity: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          )}
        </motion.button>
      )}
    </AnimatePresence>
  );
}