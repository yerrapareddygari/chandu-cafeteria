import { motion, AnimatePresence } from "framer-motion";

export default function ConfirmModal({ open, title, message, confirmLabel = "Confirm", danger = false, onConfirm, onCancel }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCancel}
        >
          <motion.div
            className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.9 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-kpit-black mb-2">{title}</h3>
            <p className="text-kpit-dark-gray text-sm mb-6">{message}</p>
            <div className="flex gap-3">
              <button onClick={onCancel} className="flex-1 px-4 py-2.5 rounded-lg border border-kpit-light-gray text-kpit-dark-gray font-medium hover:bg-kpit-light-gray transition-colors">
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className={`flex-1 px-4 py-2.5 rounded-lg font-semibold text-white transition-colors ${
                  danger ? "bg-red-600 hover:bg-red-700" : "bg-kpit-purple-primary hover:bg-kpit-purple-dark"
                }`}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}