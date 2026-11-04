import { motion } from "framer-motion";
import { useMemo } from "react";

export default function FloatingParticles({ count = 20 }) {
  const particles = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 3 + Math.random() * 8,
        duration: 3 + Math.random() * 7,
        delay: Math.random() * 5,
        opacity: 0.03 + Math.random() * 0.06,
        shape: Math.random() > 0.5 ? "circle" : "square",
      })),
    [count]
  );

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className={`absolute ${p.shape === "circle" ? "rounded-full" : "rounded-sm"} bg-kpit-purple-primary`}
          style={{
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            top: `${p.y}%`,
            opacity: p.opacity,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, p.size * 1.5, 0],
            opacity: [p.opacity, p.opacity * 1.8, p.opacity],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}