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
 * Module:      AddToCartButton
 * Description: Spring-animated add-to-cart micro-interaction.
 *              Scale-down on tap, scale-up on hover, color flash on success.
 * Usage:       <AddToCartButton onClick={handleAdd} inCart={false} />
 * Dependencies: react, framer-motion
 */

import { motion } from "framer-motion";

const springConfig = { type: "spring", stiffness: 500, damping: 18, mass: 1 };

export default function AddToCartButton({
  onClick,
  inCart = false,
  quantity = 0,
  size = "md",
  className = "",
}) {
  const sizeClasses = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-5 py-2.5 text-sm",
  };

  return (
    <motion.button
      onClick={onClick}
      className={`font-semibold rounded-lg transition-colors select-none ${sizeClasses[size]} ${
        inCart
          ? "bg-kpit-purple-primary text-white"
          : "bg-kpit-green-primary text-kpit-black hover:bg-kpit-black hover:text-white"
      } ${className}`}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.9 }}
      transition={springConfig}
      layout
    >
      {inCart ? (
        <span className="flex items-center gap-2">
          <motion.span
            key={`qty-${quantity}`}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {quantity}
          </motion.span>
          <span className="w-px h-4 bg-white/30" />
          <motion.svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.25, delay: 0.05 }}
          >
            <polyline points="20 6 9 17 4 12" />
          </motion.svg>
        </span>
      ) : (
        <motion.span
          className="flex items-center gap-1.5"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.15 }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add
        </motion.span>
      )}
    </motion.button>
  );
}