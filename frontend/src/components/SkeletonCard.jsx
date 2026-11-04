import { motion } from "framer-motion";

/** Table-row shimmer loading skeletons for order and menu lists. */
export default function SkeletonCard({ lines = 3, className = "" }) {
  return (
    <div className={`card overflow-hidden ${className}`}>
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <motion.div
              className="h-6 w-20 rounded-lg bg-kpit-light-gray"
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="h-4 w-16 rounded-md bg-kpit-light-gray"
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
          <motion.div
            className="h-5 w-14 rounded-md bg-kpit-light-gray"
            animate={{ opacity: [1, 0.4, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
          />
        </div>

        {/* Progress bar */}
        <motion.div
          className="h-2 w-full rounded-full bg-kpit-light-gray"
          animate={{ opacity: [1, 0.4, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        />

        {/* Lines */}
        {Array.from({ length: lines }, (_, i) => (
          <div key={i} className="flex justify-between items-center">
            <motion.div
              className="h-3 rounded-md bg-kpit-light-gray"
              style={{ width: `${40 + Math.random() * 30}%` }}
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.2 + i * 0.15,
              }}
            />
            <motion.div
              className="h-3 w-12 rounded-md bg-kpit-light-gray"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.4 + i * 0.15,
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}