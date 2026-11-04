import { motion } from "framer-motion";
import { useEffect } from "react";
import { fireOrderConfetti } from "./OrderConfetti";

export default function CollectionConfirmation({ order, onClose, delivered }) {
  useEffect(() => {
    fireOrderConfetti();
    // Auto-dismiss delivered celebration after 4 seconds
    if (delivered) {
      const t = setTimeout(onClose, 4000);
      return () => clearTimeout(t);
    }
  }, []);

  const isDelivered = delivered || order.status === "delivered";

  return (
    <motion.div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-white rounded-[28px] p-0 w-full max-w-md shadow-2xl overflow-hidden"
        initial={{ scale: 0.7, opacity: 0, y: 40 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.7, opacity: 0, y: 40 }}
        transition={{ type: "spring", stiffness: 250, damping: 22 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Hero banner */}
        <div className="bg-kpit-purple-primary py-10 px-6 text-center relative overflow-hidden">
          {/* Background particles */}
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-white/15"
              style={{
                width: 8 + Math.random() * 12,
                height: 8 + Math.random() * 12,
                left: `${10 + (i * 15) + Math.random() * 10}%`,
                top: `${10 + Math.random() * 60}%`,
              }}
              animate={{
                y: [-20, -80],
                opacity: [0.8, 0],
                scale: [1, 0.3],
              }}
              transition={{
                duration: 1.5 + Math.random(),
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeOut",
              }}
            />
          ))}

          <motion.div
            className="text-7xl mb-3"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
          >
            {isDelivered ? "✅" : "🍽️"}
          </motion.div>

          <motion.h2
            className="text-2xl font-bold text-white mb-1"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            {isDelivered ? "Order Complete!" : "Ready to Collect!"}
          </motion.h2>

          <motion.p
            className="text-white/70 text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            {isDelivered ? "Enjoy your meal! 🎉" : "Payment confirmed — your food is waiting"}
          </motion.p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Order code badge */}
          {!isDelivered && (
            <motion.div
              className="bg-kpit-green-50 rounded-2xl p-4 text-center"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, delay: 0.9 }}
            >
              <div className="text-xs text-kpit-green-dark font-medium mb-1">SHOW THIS CODE AT COUNTER</div>
              <motion.div
                className="font-mono font-bold text-3xl text-kpit-green-dark tracking-widest"
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 400, delay: 1.1 }}
              >
                #{order.order_code}
              </motion.div>
            </motion.div>
          )}

          {isDelivered && (
            <motion.div
              className="bg-kpit-green-50 rounded-2xl p-5 text-center"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, delay: 0.9 }}
            >
              <div className="text-4xl mb-2">🍽️</div>
              <div className="font-bold text-kpit-green-dark text-lg mb-1">Enjoy your meal!</div>
              <div className="text-xs text-kpit-green-dark/70">
                Order #{order.order_code} — ₹{order.total.toFixed(2)} paid
              </div>
            </motion.div>
          )}

          {/* Items summary */}
          <div className="space-y-2">
            {order.items.map((item, idx) => (
              <motion.div
                key={idx}
                className="flex items-center justify-between bg-kpit-light-gray/50 rounded-xl px-4 py-3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.2 + idx * 0.08 }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-kpit-purple-50 flex items-center justify-center text-sm">
                    {item.quantity}x
                  </div>
                  <span className="text-sm font-medium text-kpit-black">{item.name}</span>
                </div>
                <span className="text-sm text-kpit-dark-gray">₹{(item.price * item.quantity).toFixed(2)}</span>
              </motion.div>
            ))}
          </div>

          {/* Total + action */}
          <motion.div
            className="flex items-center justify-between pt-2 border-t border-kpit-light-gray"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
          >
            <span className="text-kpit-dark-gray font-medium">Total Paid</span>
            <span className="text-kpit-purple-dark font-bold text-xl">₹{order.total.toFixed(2)}</span>
          </motion.div>

          {!isDelivered && (
            <motion.button
              onClick={onClose}
              className="btn-primary w-full text-base py-3"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.7 }}
            >
              ✅ Got It — Collect My Food!
            </motion.button>
          )}
          {isDelivered && (
            <motion.p
              className="text-xs text-kpit-mid-gray text-center pt-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2 }}
            >
              This screen will close automatically…
            </motion.p>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}