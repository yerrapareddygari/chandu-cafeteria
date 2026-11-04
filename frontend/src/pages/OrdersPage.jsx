import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../api/axios";
import OrderTracker from "../components/OrderTracker";
import CollectionConfirmation from "../components/CollectionConfirmation";
import OrderQRModal from "../components/OrderQRModal";
import SkeletonCard from "../components/SkeletonCard";
import StatusCharacter from "../components/StatusCharacter";
import Pagination from "../components/Pagination";
import { useOrderNotifications } from "../hooks/useWebSocket";
import toast from "react-hot-toast";

const STATUS_COLORS = {
  pending: "bg-amber-50 border-amber-200 text-amber-800",
  preparing: "bg-kpit-purple-50 border-kpit-purple-200 text-kpit-purple-dark",
  ready: "bg-blue-50 border-blue-200 text-blue-700",
  paid: "bg-kpit-green-50 border-kpit-green-200 text-kpit-green-dark",
  delivered: "bg-kpit-light-gray border-kpit-light-gray text-kpit-mid-gray",
  cancelled: "bg-red-50 border-red-200 text-red-700",
};

const STATUS_LABELS = {
  pending: "Order Placed",
  preparing: "Preparing",
  ready: "Ready — Pay at Counter!",
  paid: "Paid — Collect Your Food!",
  delivered: "Collected",
  cancelled: "Cancelled",
};

const STATUS_TIPS = {
  pending: "Hang tight! Your order is being processed.",
  preparing: "👨‍🍳 Our chef is working on your meal. Estimated 10-15 minutes.",
  ready: "💳 Please proceed to the counter to pay for your order.",
  paid: "✅ Payment confirmed! Collect your food at the counter.",
  delivered: "🍽️ Enjoy your meal! Thank you for ordering.",
};

const stagger = { animate: { transition: { staggerChildren: 0.08 } } };

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCollection, setShowCollection] = useState(null);
  const [commentText, setCommentText] = useState({});
  const [qrOrder, setQrOrder] = useState(null);
  const [pastExpanded, setPastExpanded] = useState(false);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const LIMIT = 5;
  const prevPaidRef = useRef(new Set());
  const prevDeliveredRef = useRef(new Set());

  const fetchOrders = async (p = 0) => {
    try {
      const { data } = await api.get(`/orders/mine?skip=${p * LIMIT}&limit=${LIMIT}`);
      const currentPaidIds = new Set(
        data.orders.filter((o) => o.status === "paid").map((o) => o._id)
      );
      const currentDeliveredIds = new Set(
        data.orders.filter((o) => o.status === "delivered").map((o) => o._id)
      );
      const newlyPaid = [...currentPaidIds].filter((id) => !prevPaidRef.current.has(id));
      const newlyDelivered = [...currentDeliveredIds].filter((id) => !prevDeliveredRef.current.has(id));
      if (newlyPaid.length > 0) {
        const order = data.orders.find((o) => o._id === newlyPaid[0]);
        if (order) setShowCollection(order);
      } else if (newlyDelivered.length > 0) {
        const order = data.orders.find((o) => o._id === newlyDelivered[0]);
        if (order) setShowCollection({ ...order, _delivered: true });
      }
      prevPaidRef.current = currentPaidIds;
      prevDeliveredRef.current = currentDeliveredIds;
      setOrders(data.orders);
      setTotal(data.total);
      setHasMore(data.has_more);
    } catch {
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const changePage = (p) => {
    setPage(p);
  };

  const sendComment = async (orderId) => {
    const msg = commentText[orderId]?.trim();
    if (!msg) return;
    try {
      await api.post(`/orders/${orderId}/comments`, { message: msg });
      toast.success("Message sent");
      setCommentText({ ...commentText, [orderId]: "" });
      setPage(page); // trigger re-fetch on current page
    } catch { toast.error("Failed to send message"); }
  };

  useEffect(() => {
    setLoading(true);
    fetchOrders(page);
    // Fallback polling: every 2 minutes
    const interval = setInterval(() => fetchOrders(page), 120000);
    return () => clearInterval(interval);
  }, [page]);

  // Real-time WebSocket: re-fetch orders instantly on any notification
  useOrderNotifications(() => {
    fetchOrders(page);
  });

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <SkeletonCard key={i} lines={3} />
        ))}
      </div>
    );
  }

  const activeOrders = orders.filter((o) => o.status !== "delivered" && o.status !== "cancelled");
  const pastOrders = orders.filter((o) => o.status === "delivered" || o.status === "cancelled");

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl font-bold text-kpit-black">My Orders</h1>
        <p className="text-kpit-dark-gray text-sm mt-1">Track your orders in real-time</p>
      </motion.div>

      {orders.length === 0 && (
        <motion.div
          className="text-center py-16 text-kpit-dark-gray"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <motion.div
            className="text-6xl mb-4"
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            🛒
          </motion.div>
          <p className="text-lg font-medium">No orders yet</p>
          <p className="text-sm mt-1">Head to the menu to place your first order!</p>
        </motion.div>
      )}

      {/* Active orders */}
      {activeOrders.length > 0 && (
        <div className="mb-10">
          <h2 className="text-sm font-semibold text-kpit-dark-gray uppercase tracking-wider mb-4">
            Active Orders ({activeOrders.length})
          </h2>
          <motion.div className="space-y-6" variants={stagger} initial="initial" animate="animate">
            <AnimatePresence mode="popLayout">
              {activeOrders.map((order) => (
                <motion.div
                  key={order._id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.3 } }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                >
                  <div className="card">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <motion.span
                          className="font-mono font-bold text-kpit-purple-dark bg-kpit-purple-50 px-3 py-1 rounded-lg text-sm"
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: "spring", stiffness: 400 }}
                        >
                          #{order.order_code}
                        </motion.span>
                        <motion.span
                          key={order.status}
                          className={`text-xs px-3 py-1 rounded-full font-medium border ${STATUS_COLORS[order.status]}`}
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: "spring", stiffness: 400, delay: 0.1 }}
                        >
                          {STATUS_LABELS[order.status]}
                        </motion.span>
                        <button
                          onClick={() => setQrOrder(order)}
                          className="ml-auto text-xs px-3 py-1.5 rounded-lg bg-kpit-black text-kpit-green-primary hover:bg-kpit-black/90 transition-colors font-semibold"
                        >
                          📱 Show QR
                        </button>
                      </div>
                      <span className="text-kpit-purple-dark font-bold text-lg">₹{order.total.toFixed(2)}</span>
                    </div>

                    {/* Status character + tracker */}
                    <div className="mb-5">
                      <StatusCharacter status={order.status} />
                    </div>
                    <div className="mb-5 px-2">
                      <OrderTracker status={order.status} />
                    </div>

                    {/* Status tip */}
                    <motion.div
                      key={order.status + "-tip"}
                      className={`p-3 rounded-xl text-sm font-medium mb-4 ${
                        order.status === "paid"
                          ? "bg-kpit-green-50 text-kpit-green-dark border border-kpit-green-200"
                          : order.status === "ready"
                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                          : order.status === "preparing"
                          ? "bg-kpit-purple-50 text-kpit-purple-dark border border-kpit-purple-100"
                          : "bg-kpit-light-gray text-kpit-dark-gray"
                      }`}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      transition={{ duration: 0.3 }}
                    >
                      {STATUS_TIPS[order.status]}
                    </motion.div>

                    {/* Payment callout */}
                    <AnimatePresence>
                      {order.status === "ready" && (
                        <motion.div
                          className="bg-kpit-purple-primary text-white p-4 rounded-xl flex items-center gap-3 mb-4"
                          initial={{ opacity: 0, scale: 0.95, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ type: "spring", stiffness: 300 }}
                        >
                          <motion.span
                            className="text-3xl"
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                          >
                            💳
                          </motion.span>
                          <div>
                            <div className="font-bold">Pay at Counter</div>
                            <div className="text-sm text-white/80">
                              Show code <span className="font-mono font-bold text-kpit-green-primary">#{order.order_code}</span> to pay
                            </div>
                          </div>
                        </motion.div>
                      )}
                      {order.status === "paid" && (
                        <motion.div
                          className="bg-kpit-green-50 text-kpit-green-dark p-4 rounded-xl flex items-center gap-3 mb-4 border border-kpit-green-200"
                          initial={{ opacity: 0, scale: 0.95, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ type: "spring", stiffness: 300 }}
                        >
                          <motion.span
                            className="text-3xl"
                            animate={{ rotate: [0, 10, -10, 0] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                          >
                            🎉
                          </motion.span>
                          <div>
                            <div className="font-bold">Payment Confirmed!</div>
                            <div className="text-sm">Collect your food at the counter</div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Items list */}
                    <div className="border-t border-kpit-light-gray pt-3">
                      <div className="space-y-1.5">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span className="text-kpit-dark-gray">{item.quantity}x {item.name}</span>
                            <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                      <div className="text-xs text-kpit-mid-gray mt-2">
                        Ordered: {new Date(order.created_at).toLocaleString()}
                      </div>
                    </div>

                    {/* Comments */}
                    {order.comments && order.comments.length > 0 && (
                      <div className="mt-3 space-y-1.5 max-h-28 overflow-y-auto bg-kpit-light-gray/40 rounded-lg p-3">
                        {order.comments.map((c, ci) => (
                          <div key={ci} className="text-xs">
                            <span className={`font-semibold ${c.role === "manager" || c.role === "admin" ? "text-kpit-purple-dark" : "text-kpit-dark-gray"}`}>
                              {c.user_name}:
                            </span>{" "}
                            <span className="text-kpit-dark-gray">{c.message}</span>
                            <span className="text-kpit-mid-gray ml-1.5">
                              {new Date(c.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Reply input */}
                    <div className="flex gap-2 mt-3">
                      <input
                        className="input-field text-xs py-2"
                        placeholder="Message about your order..."
                        value={commentText[order._id] || ""}
                        onChange={(e) => setCommentText({ ...commentText, [order._id]: e.target.value })}
                        onKeyDown={(e) => e.key === "Enter" && sendComment(order._id)}
                      />
                      <button
                        onClick={() => sendComment(order._id)}
                        className="text-xs px-3 py-2 rounded-lg bg-kpit-purple-50 text-kpit-purple-dark hover:bg-kpit-purple-100 transition-colors font-semibold flex-shrink-0"
                      >
                        Send
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          <Pagination page={page} limit={LIMIT} total={total} hasMore={hasMore} loading={loading} onChange={changePage} />
        </div>
      )}

      {/* Past orders — collapsible */}
      {pastOrders.length > 0 && (
        <div className="mt-8">
          <motion.button
            onClick={() => setPastExpanded(!pastExpanded)}
            className="w-full flex items-center justify-between text-left mb-4 group"
            whileTap={{ scale: 0.98 }}
          >
            <div>
              <h2 className="text-sm font-semibold text-kpit-dark-gray uppercase tracking-wider">
                Past Orders ({pastOrders.length})
              </h2>
            </div>
            <motion.span
              className="text-kpit-mid-gray text-lg transition-transform"
              animate={{ rotate: pastExpanded ? 180 : 0 }}
            >
              ▼
            </motion.span>
          </motion.button>
          <AnimatePresence>
            {pastExpanded && (
              <motion.div
                className="space-y-3 overflow-hidden"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.35, ease: "easeInOut" }}
              >
            {pastOrders.map((order, i) => (
              <motion.div
                key={order._id}
                className="card opacity-75 hover:opacity-100 transition-opacity"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm text-kpit-mid-gray">#{order.order_code}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${STATUS_COLORS[order.status]}`}>
                      {STATUS_LABELS[order.status]}
                    </span>
                  </div>
                  <span className="text-kpit-dark-gray font-semibold">₹{order.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs text-kpit-mid-gray mt-2">
                  <span>
                    {order.items.map((i) => `${i.quantity}x ${i.name}`).join(", ")}
                  </span>
                  <span>{new Date(order.created_at).toLocaleDateString()}</span>
                </div>
              </motion.div>
            ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Collection celebration */}
      <AnimatePresence>
        {showCollection && (
          <CollectionConfirmation
            order={showCollection}
            delivered={showCollection._delivered}
            onClose={() => setShowCollection(null)}
          />
        )}
      </AnimatePresence>

      {/* QR code modal */}
      <AnimatePresence>
        {qrOrder && (
          <OrderQRModal order={qrOrder} onClose={() => setQrOrder(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}