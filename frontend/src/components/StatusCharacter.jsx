import { motion } from "framer-motion";

/**
 * Animated human characters for each order status.
 * Each character has contextual animations — cooking, serving, etc.
 */

const characters = {
  pending: {
    label: "Order Received",
    subtitle: "We've got your order!",
  },
  preparing: {
    label: "Chef is Cooking",
    subtitle: "Fresh & hot, just for you",
  },
  ready: {
    label: "Pay at Counter",
    subtitle: "Your meal is ready!",
  },
  paid: {
    label: "Collect Your Food",
    subtitle: "Enjoy your meal!",
  },
  delivered: {
    label: "Order Complete",
    subtitle: "Thank you for ordering!",
  },
};

/** Chef cooking — pot stirring animation */
function ChefPreparing({ active }) {
  return (
    <div className="relative w-32 h-32 mx-auto">
      {/* Chef body */}
      <motion.div
        className="absolute bottom-0 left-1/2 -translate-x-1/2"
        animate={active ? { rotate: [-2, 2, -2] } : {}}
        transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
      >
        {/* Chef hat */}
        <div className="relative mx-auto w-12">
          <div className="h-4 bg-white rounded-t-xl mx-auto w-10" />
          <div className="h-1.5 bg-white rounded-full -mt-0.5" />
        </div>
        {/* Head */}
        <div className="w-8 h-8 bg-[#F5D6B4] rounded-full mx-auto -mt-1 relative">
          <div className="absolute top-1.5 left-1 w-1.5 h-1.5 bg-kpit-black rounded-full" />
          <div className="absolute top-1.5 right-1 w-1.5 h-1.5 bg-kpit-black rounded-full" />
          <motion.div
            className="absolute bottom-1 left-1/2 -translate-x-1/2 w-2 h-1 bg-[#E8917A] rounded-full"
            animate={active ? { scaleY: [1, 1.3, 1] } : {}}
            transition={{ repeat: Infinity, duration: 0.8 }}
          />
        </div>
        {/* Body — chef coat */}
        <div className="w-12 h-10 bg-white rounded-lg mx-auto -mt-1 relative">
          <div className="absolute top-1 left-1/2 -translate-x-1/2 flex gap-1">
            <div className="w-1.5 h-1.5 bg-kpit-black rounded-full" />
            <div className="w-1.5 h-1.5 bg-kpit-black rounded-full" />
          </div>
          {/* Apron */}
          <div className="absolute bottom-0 left-1 right-1 h-6 bg-kpit-light-gray rounded-b-md" />
        </div>
        {/* Arms */}
        <motion.div
          className="absolute top-8 -left-3 w-5 h-2 bg-white rounded-full origin-right"
          animate={active ? { rotate: [-20, 20, -20] } : {}}
          transition={{ repeat: Infinity, duration: 1, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-8 -right-3 w-5 h-2 bg-white rounded-full origin-left"
          animate={active ? { rotate: [15, -25, 15] } : {}}
          transition={{ repeat: Infinity, duration: 0.8, ease: "easeInOut" }}
        />
      </motion.div>

      {/* Pot */}
      <motion.div
        className="absolute bottom-1 left-1/2 -translate-x-1/2"
        animate={active ? { y: [0, -3, 0] } : {}}
        transition={{ repeat: Infinity, duration: 0.6, ease: "easeInOut" }}
      >
        <div className="w-14 h-8 bg-[#C4A484] rounded-b-xl rounded-t-sm relative mx-auto">
          {/* Steam */}
          {active && (
            <>
              <motion.div
                className="absolute -top-3 left-2 w-1.5 h-3 bg-white/60 rounded-full"
                animate={{ y: [-4, -12], opacity: [0.6, 0], scaleX: [1, 1.5] }}
                transition={{ repeat: Infinity, duration: 1.2, delay: 0 }}
              />
              <motion.div
                className="absolute -top-3 left-6 w-1.5 h-3 bg-white/60 rounded-full"
                animate={{ y: [-4, -14], opacity: [0.6, 0], scaleX: [1, 1.8] }}
                transition={{ repeat: Infinity, duration: 1.4, delay: 0.4 }}
              />
              <motion.div
                className="absolute -top-3 right-2 w-1.5 h-3 bg-white/60 rounded-full"
                animate={{ y: [-4, -10], opacity: [0.6, 0], scaleX: [1, 1.3] }}
                transition={{ repeat: Infinity, duration: 1.1, delay: 0.7 }}
              />
            </>
          )}
          {/* Pot handles */}
          <div className="absolute -left-2 top-2 w-2 h-3 border-2 border-[#A0846C] rounded-l-full" />
          <div className="absolute -right-2 top-2 w-2 h-3 border-2 border-[#A0846C] rounded-r-full" />
        </div>
      </motion.div>
    </div>
  );
}

/** Cashier for payment */
function CashierPayment({ active }) {
  return (
    <div className="relative w-32 h-32 mx-auto">
      <motion.div
        className="absolute bottom-0 left-1/2 -translate-x-1/2"
        animate={active ? { y: [0, -2, 0] } : {}}
        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
      >
        {/* Hair */}
        <div className="w-10 h-3 bg-kpit-black rounded-t-full mx-auto -mb-1" />
        {/* Head */}
        <div className="w-8 h-8 bg-[#F5D6B4] rounded-full mx-auto relative">
          <div className="absolute top-1.5 left-1 w-1.5 h-1.5 bg-kpit-black rounded-full" />
          <div className="absolute top-1.5 right-1 w-1.5 h-1.5 bg-kpit-black rounded-full" />
          <motion.div
            className="absolute bottom-1 left-1/2 -translate-x-1/2 w-2.5 h-1 bg-[#E8917A] rounded-full"
            animate={active ? { scaleX: [1, 1.3, 1] } : {}}
            transition={{ repeat: Infinity, duration: 1.5 }}
          />
        </div>
        {/* Body — shirt */}
        <div className="w-12 h-10 bg-kpit-purple-primary rounded-lg mx-auto -mt-1 relative">
          {/* Tie */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-4 bg-kpit-green-primary rounded-b-sm" />
          {/* Name tag */}
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-6 h-2 bg-white rounded-sm" />
        </div>
        {/* Counter */}
        <div className="w-16 h-3 bg-[#8B7355] rounded-t-lg mx-auto -mt-1" />
        {/* Hands */}
        <motion.div
          className="absolute top-9 -left-2 w-3 h-5 bg-[#F5D6B4] rounded-full"
          animate={active ? { rotate: [-5, 5, -5] } : {}}
          transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-9 -right-2 w-3 h-5 bg-[#F5D6B4] rounded-full"
          animate={active ? { rotate: [5, -5, 5] } : {}}
          transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut", delay: 0.3 }}
        />
      </motion.div>

      {/* Floating money */}
      {active && (
        <>
          <motion.div
            className="absolute text-sm"
            style={{ left: "10%", top: "20%" }}
            animate={{ y: [-5, -25], opacity: [0.8, 0], rotate: [0, 15] }}
            transition={{ repeat: Infinity, duration: 2, delay: 0 }}
          >
            💵
          </motion.div>
          <motion.div
            className="absolute text-xs"
            style={{ right: "15%", top: "30%" }}
            animate={{ y: [-5, -20], opacity: [0.7, 0], rotate: [0, -10] }}
            transition={{ repeat: Infinity, duration: 1.8, delay: 0.6 }}
          >
            💳
          </motion.div>
        </>
      )}
    </div>
  );
}

/** Server handing over food */
function ServerDelivering({ active }) {
  return (
    <div className="relative w-32 h-32 mx-auto">
      <motion.div
        className="absolute bottom-0 left-1/2 -translate-x-1/2"
        animate={active ? { x: [0, 3, 0] } : {}}
        transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
      >
        {/* Hair */}
        <div className="w-10 h-4 bg-kpit-black rounded-t-full mx-auto -mb-1" />
        {/* Head */}
        <div className="w-8 h-8 bg-[#F5D6B4] rounded-full mx-auto relative">
          <div className="absolute top-1.5 left-1 w-1.5 h-1.5 bg-kpit-black rounded-full" />
          <div className="absolute top-1.5 right-1 w-1.5 h-1.5 bg-kpit-black rounded-full" />
          <motion.div
            className="absolute bottom-1 left-1/2 -translate-x-1/2 w-2.5 h-1.5 bg-[#E8917A] rounded-full"
            animate={active ? { scaleY: [1, 1.2, 1] } : {}}
            transition={{ repeat: Infinity, duration: 1 }}
          />
        </div>
        {/* Body */}
        <div className="w-12 h-10 bg-kpit-green-primary rounded-lg mx-auto -mt-1" />
        {/* Tray with food */}
        <motion.div
          className="relative mx-auto -mt-1"
          animate={active ? { y: [0, -2, 0] } : {}}
          transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
        >
          {/* Arm */}
          <div className="w-16 h-2 bg-[#F5D6B4] rounded-full mx-auto" />
          {/* Tray */}
          <div className="w-14 h-2 bg-[#C4A484] rounded-lg mx-auto -mt-0.5" />
          {/* Plate */}
          <div className="w-10 h-3 bg-white rounded-full mx-auto -mt-1 border border-kpit-light-gray relative">
            {/* Food on plate */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-1.5 bg-[#E8917A] rounded-full" />
          </div>
        </motion.div>
      </motion.div>

      {/* Sparkles */}
      {active && (
        <>
          <motion.div
            className="absolute text-xs"
            style={{ left: "15%", top: "15%" }}
            animate={{ scale: [0, 1, 0], opacity: [1, 0.5, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, delay: 0 }}
          >
            ✨
          </motion.div>
          <motion.div
            className="absolute text-xs"
            style={{ right: "15%", top: "10%" }}
            animate={{ scale: [0, 1, 0], opacity: [1, 0.5, 0] }}
            transition={{ repeat: Infinity, duration: 1.3, delay: 0.5 }}
          >
            ✨
          </motion.div>
        </>
      )}
    </div>
  );
}

/** Order placed — receipt printing */
function OrderPending({ active }) {
  return (
    <div className="relative w-32 h-32 mx-auto">
      <motion.div
        className="absolute bottom-0 left-1/2 -translate-x-1/2"
        animate={active ? { rotate: [-1, 1, -1] } : {}}
        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
      >
        {/* Head */}
        <div className="w-8 h-8 bg-[#F5D6B4] rounded-full mx-auto relative">
          <div className="absolute top-1.5 left-1 w-1.5 h-1.5 bg-kpit-black rounded-full" />
          <div className="absolute top-1.5 right-1 w-1.5 h-1.5 bg-kpit-black rounded-full" />
          <motion.div
            className="absolute bottom-1 left-1/2 -translate-x-1/2 w-2 h-1 bg-[#E8917A] rounded-full"
            animate={active ? { scaleX: [1, 1.4, 1] } : {}}
            transition={{ repeat: Infinity, duration: 1.2 }}
          />
        </div>
        {/* Body */}
        <div className="w-12 h-10 bg-kpit-light-gray rounded-lg mx-auto -mt-1" />
        {/* Receipt printer */}
        <motion.div className="relative mx-auto -mt-1">
          <div className="w-13 h-6 bg-[#D4C5B2] rounded-lg mx-auto relative">
            <motion.div
              className="absolute -top-4 left-1/2 -translate-x-1/2 w-5 h-6 bg-white rounded-sm border border-kpit-light-gray origin-top"
              animate={active ? { scaleY: [0.3, 1], y: [0, 6] } : {}}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeOut" }}
            >
              <div className="w-full h-0.5 bg-kpit-light-gray mt-1.5" />
              <div className="w-3/4 h-0.5 bg-kpit-light-gray mt-1 mx-auto" />
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default function StatusCharacter({ status }) {
  const char = characters[status];
  if (!char) return null;

  return (
    <div className="text-center">
      <div className="mb-2">
        {status === "preparing" && <ChefPreparing active />}
        {status === "ready" && <CashierPayment active />}
        {status === "paid" && <ServerDelivering active />}
        {status === "pending" && <OrderPending active />}
        {status === "delivered" && <ServerDelivering active />}
      </div>
      <motion.p
        className="text-sm font-semibold text-kpit-black"
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        key={status}
      >
        {char.label}
      </motion.p>
      <motion.p
        className="text-xs text-kpit-dark-gray mt-0.5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {char.subtitle}
      </motion.p>
    </div>
  );
}