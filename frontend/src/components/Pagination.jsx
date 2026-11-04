import { motion } from "framer-motion";

export default function Pagination({ page, limit, total, hasMore, loading, onChange }) {
  const totalPages = Math.ceil(total / limit);
  if (total <= limit && !page) return null;

  const pages = [];
  for (let i = 0; i < totalPages; i++) {
    if (i === 0 || i === totalPages - 1 || Math.abs(i - page) <= 1) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== -1) {
      pages.push(-1);
    }
  }

  return (
    <div className="flex items-center justify-center gap-1 mt-6">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page === 0 || loading}
        className="px-3 py-1.5 text-xs font-medium rounded-lg text-kpit-mid-gray hover:bg-kpit-light-gray disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        ← Prev
      </button>

      {pages.map((p, i) =>
        p === -1 ? (
          <span key={`dots-${i}`} className="px-1 text-kpit-mid-gray text-xs">…</span>
        ) : (
          <motion.button
            key={p}
            onClick={() => onChange(p)}
            disabled={loading}
            className={`w-8 h-8 text-xs font-medium rounded-lg transition-colors ${
              p === page
                ? "bg-kpit-purple-primary text-white shadow-sm"
                : "text-kpit-mid-gray hover:bg-kpit-light-gray"
            }`}
            whileTap={{ scale: 0.92 }}
          >
            {p + 1}
          </motion.button>
        )
      )}

      <button
        onClick={() => onChange(page + 1)}
        disabled={!hasMore || loading}
        className="px-3 py-1.5 text-xs font-medium rounded-lg text-kpit-mid-gray hover:bg-kpit-light-gray disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        Next →
      </button>

      <span className="text-[10px] text-kpit-mid-gray ml-2">
        {total} total
      </span>
    </div>
  );
}