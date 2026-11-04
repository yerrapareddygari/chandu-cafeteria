import { motion } from "framer-motion";
import OrderTracker from "./OrderTracker";

const STATUS_COLORS = {
  pending: "text-amber-700 bg-amber-50 border-amber-200",
  preparing: "text-kpit-purple-dark bg-kpit-purple-50 border-kpit-purple-200",
  ready: "text-blue-700 bg-blue-50 border-blue-200",
  paid: "text-kpit-green-dark bg-kpit-green-50 border-kpit-green-200",
  delivered: "text-kpit-mid-gray bg-kpit-light-gray border-kpit-light-gray",
  cancelled: "text-red-700 bg-red-50 border-red-200",
};

export default function OrderQRModal({ order, onClose, compact }) {
  if (!order) return null;

  // Compact mode — inline QR badge for staff view
  if (compact) {
    return (
      <div className="bg-white rounded-xl p-2 border border-blue-200 flex-shrink-0">
        <div className="w-12 h-12 bg-kpit-black rounded-lg flex items-center justify-center">
          <span className="text-[8px] font-mono font-bold text-kpit-green-primary tracking-tight leading-tight text-center">
            #{order.order_code}
          </span>
        </div>
      </div>
    );
  }

  // Full modal mode
  return (
    <motion.div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-white rounded-[24px] w-full max-w-sm shadow-2xl overflow-hidden"
        initial={{ scale: 0.85, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.85, opacity: 0, y: 30 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-kpit-black text-white px-6 py-5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-kpit-green-primary font-mono font-bold">
              ORDER DETAILS
            </span>
            <button
              onClick={onClose}
              className="text-white/60 hover:text-white text-xl leading-none"
            >
              ✕
            </button>
          </div>
          <div className="font-mono text-3xl font-bold tracking-wider text-kpit-green-primary">
            #{order.order_code}
          </div>
          <div className="text-white/60 text-xs mt-1">
            {new Date(order.created_at).toLocaleString()}
          </div>
        </div>

        {/* Status */}
        <div className="px-6 pt-4 pb-2">
          <span
            className={`inline-block text-xs px-3 py-1 rounded-full font-semibold border ${STATUS_COLORS[order.status] || "text-kpit-mid-gray"}`}
          >
            {order.status.toUpperCase()}
          </span>
        </div>

        {/* Tracker */}
        <div className="px-4 mb-3">
          <OrderTracker status={order.status} />
        </div>

        {/* Items */}
        <div className="px-6 pb-2 space-y-1.5">
          {order.items.map((item, idx) => (
            <div key={idx} className="flex justify-between text-sm">
              <span className="text-kpit-black font-medium">
                {item.quantity}x {item.name}
              </span>
              <span className="text-kpit-dark-gray">
                ₹{(item.price * item.quantity).toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="mx-6 border-t border-dashed border-kpit-light-gray my-3" />

        {/* Total */}
        <div className="px-6 pb-4 flex justify-between items-center">
          <span className="text-kpit-dark-gray text-sm font-medium">Total</span>
          <span className="text-kpit-purple-dark text-xl font-bold">
            ₹{order.total.toFixed(2)}
          </span>
        </div>

        {/* Action tip */}
        <div className="mx-6 mb-5 p-3 rounded-xl text-xs font-medium bg-kpit-light-gray text-kpit-dark-gray text-center">
          Show this at the counter for payment &amp; collection
        </div>
      </motion.div>
    </motion.div>
  );
}