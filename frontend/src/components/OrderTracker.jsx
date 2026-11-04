import { motion } from "framer-motion";

const STEPS = [
  { key: "pending", label: "Placed", icon: "📝" },
  { key: "preparing", label: "Preparing", icon: "👨‍🍳" },
  { key: "ready", label: "Ready", icon: "🔔" },
  { key: "paid", label: "Paid", icon: "💳" },
  { key: "delivered", label: "Done", icon: "✅" },
];

const stepWidthPct = 100 / (STEPS.length - 1);

export default function OrderTracker({ status }) {
  const activeIdx = STEPS.findIndex((s) => s.key === status);

  return (
    <div className="w-full">
      <div className="flex items-start relative" style={{ paddingTop: "6px", paddingBottom: "4px" }}>
        {/* Progress line */}
        <div className="absolute top-[22px] left-[20px] right-[20px] h-[3px] bg-kpit-light-gray rounded-full">
          <motion.div
            className="h-full bg-kpit-purple-primary rounded-full"
            initial={{ width: "0%" }}
            animate={{
              width: activeIdx <= 0 ? "0%" : `${(activeIdx / (STEPS.length - 1)) * 100}%`,
            }}
            transition={{ duration: 0.7, ease: "easeInOut" }}
          />
        </div>

        {STEPS.map((step, i) => {
          const isCompleted = i <= activeIdx;
          const isCurrent = i === activeIdx;

          return (
            <div
              key={step.key}
              className="relative flex flex-col items-center z-10"
              style={{ width: i === 0 || i === STEPS.length - 1 ? "10%" : `${stepWidthPct}%` }}
            >
              <motion.div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm border-[2.5px] ${
                  isCompleted
                    ? "bg-kpit-purple-primary border-kpit-purple-primary text-white"
                    : "bg-white border-kpit-light-gray text-kpit-mid-gray"
                }`}
                animate={
                  isCurrent
                    ? {
                        scale: [1, 1.15, 1],
                        boxShadow: [
                          "0 0 0 0 rgba(117,61,255,0.5)",
                          "0 0 0 10px rgba(117,61,255,0)",
                          "0 0 0 0 rgba(117,61,255,0)",
                        ],
                      }
                    : {}
                }
                transition={
                  isCurrent
                    ? { repeat: Infinity, duration: 2, ease: "easeInOut" }
                    : {}
                }
              >
                {isCompleted ? "✓" : step.icon}
              </motion.div>
              <div
                className={`mt-1.5 text-[10px] font-semibold whitespace-nowrap ${
                  isCurrent
                    ? "text-kpit-purple-primary"
                    : isCompleted
                    ? "text-kpit-black"
                    : "text-kpit-mid-gray"
                }`}
              >
                {step.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}