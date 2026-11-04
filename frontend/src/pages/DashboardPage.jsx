import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useShopStatus } from "../hooks/useShopStatus";
import FoodImage from "../components/FoodImage";
import FloatingParticles from "../components/FloatingParticles";
import TiltCard from "../components/TiltCard";
import SkeletonCard from "../components/SkeletonCard";
import { fireOrderConfetti } from "../components/OrderConfetti";
import toast from "react-hot-toast";

const TIME_SLOTS = [
  { key: "breakfast", label: "Breakfast", emoji: "🌅", startH: 7, startM: 0, endH: 11, endM: 0 },
  { key: "lunch", label: "Lunch", emoji: "🍱", startH: 12, startM: 0, endH: 16, endM: 0 },
  { key: "snacks", label: "Snacks", emoji: "🍿", startH: 7, startM: 0, endH: 20, endM: 0 },
  { key: "other", label: "Other", emoji: "🍽️", startH: 7, startM: 0, endH: 20, endM: 0 },
];

function getSlotStatus(slot) {
  const now = new Date();
  const curr = now.getHours() * 60 + now.getMinutes();
  const start = slot.startH * 60 + slot.startM;
  const end = slot.endH * 60 + slot.endM;
  if (curr < start) return { status: "upcoming", color: "bg-amber-50 text-amber-700", label: "Opens at " + formatTime(slot.startH, slot.startM) };
  if (curr >= end) return { status: "closed", color: "bg-red-50 text-red-600", label: "Closed" };
  const minsLeft = end - curr;
  if (minsLeft <= 30) return { status: "closing", color: "bg-orange-50 text-orange-600", label: "Closing soon" };
  return { status: "open", color: "bg-kpit-green-50 text-kpit-green-dark", label: "Open now" };
}
function formatTime(h, m) { return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`; }

const stagger = { animate: { transition: { staggerChildren: 0.06 } } };
const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
};

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isUser = user?.role === "user";
  const { shopStatus, shopMessage, closedSlots, isSlotClosed } = useShopStatus();
  const isSlotOpen = (slotKey) => shopStatus === "open" && !isSlotClosed(slotKey);

  const [activeSlot, setActiveSlot] = useState(null);
  const [items, setItems] = useState([]);
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem("cart_items");
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });
  const [loading, setLoading] = useState(false);
  const [ordering, setOrdering] = useState(false);
  const [showCartDrawer, setShowCartDrawer] = useState(false);
  const [confirmingOrder, setConfirmingOrder] = useState(false); // inline confirm inside panel
  const [orderResult, setOrderResult] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("default");
  const [favorites, setFavorites] = useState([]);
  const [popularItems, setPopularItems] = useState([]);
  const [lastOrdered, setLastOrdered] = useState([]);
  const [reorderTab, setReorderTab] = useState("favorites");

  // ── cart helpers ──
  const cartItems = Object.values(cart);
  const cartCount = cartItems.reduce((s, i) => s + i.quantity, 0);
  const cartTotal = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);

  // Derive slot from cart items — use most common time_slot in the cart
  const resolvedSlot = useMemo(() => {
    const slots = cartItems.map((ci) => ci.time_slot).filter(Boolean);
    if (slots.length === 0) return activeSlot;
    const counts = {};
    slots.forEach((s) => { counts[s] = (counts[s] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
  }, [cartItems, activeSlot]);

  const syncStorage = (next) => { localStorage.setItem("cart_items", JSON.stringify(next)); };

  const addToCart = (item) => {
    if (shopStatus !== "open") { toast.error("The shop is currently unavailable"); return; }
    const id = item._id || item.menu_item_id;
    setCart((prev) => {
      const existing = prev[id];
      const next = { ...prev, [id]: { menu_item_id: id, name: item.name, price: item.price, time_slot: item.time_slot || activeSlot || "other", quantity: (existing?.quantity || 0) + 1 } };
      syncStorage(next);
      return next;
    });
    // When adding from quick reorder, auto-select matching slot if not already selected
    if (!item._id && item.time_slot && item.time_slot !== activeSlot) {
      setActiveSlot(item.time_slot);
    }
    // Show popup toast when added from quick reorder
    if (!item._id) {
      const slotObj = TIME_SLOTS.find((s) => s.key === (item.time_slot || activeSlot));
      const slotLabel = slotObj && slotObj.key !== "other" ? ` · ${slotObj.label} menu` : "";
      toast.success(`${item.name} added to cart${slotLabel}`, {
        icon: "🛒",
        position: "top-center",
        style: { background: "#161718", color: "#B0FF45", fontWeight: 600, fontSize: "13px" },
        duration: 2000,
      });
    }
  };

  const removeFromCart = (itemId) => {
    setCart((prev) => {
      const next = { ...prev };
      if (next[itemId]?.quantity > 1) next[itemId] = { ...next[itemId], quantity: next[itemId].quantity - 1 };
      else delete next[itemId];
      syncStorage(next);
      return next;
    });
  };

  const clearCart = () => { setCart({}); localStorage.removeItem("cart_items"); };

  const fetchMenu = useCallback(async (slot) => {
    setLoading(true);
    try {
      const { data } = await api.get(`/menu?time_slot=${slot}`);
      setItems(data.items.filter((i) => i.available));
    } catch { toast.error("Failed to load menu"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { if (activeSlot) fetchMenu(activeSlot); }, [activeSlot, fetchMenu]);

  // Quick reorder data
  const fetchReorders = useCallback(async () => {
    try {
      const [fav, pop, last] = await Promise.all([
        api.get("/orders/favorites").catch(() => ({ data: { items: [] } })),
        api.get("/orders/popular").catch(() => ({ data: { items: [] } })),
        api.get("/orders/last").catch(() => ({ data: { items: [] } })),
      ]);
      setFavorites(fav.data.items);
      setPopularItems(pop.data.items);
      setLastOrdered(last.data.items);
    } catch { /* silent */ }
  }, []);
  useEffect(() => { if (isUser) fetchReorders(); }, [isUser, fetchReorders]);

  // Auto-open cart drawer when coming from header icon click
  useEffect(() => {
    const openFromStorage = () => {
      if (localStorage.getItem("open_cart") === "1") {
        localStorage.removeItem("open_cart");
        const saved = localStorage.getItem("cart_items");
        if (saved && Object.keys(JSON.parse(saved)).length > 0) {
          setShowCartDrawer(true);
        }
      }
    };
    const handleCustomEvent = () => setShowCartDrawer(true);

    openFromStorage();
    window.addEventListener("open-cart-drawer", handleCustomEvent);
    return () => window.removeEventListener("open-cart-drawer", handleCustomEvent);
  }, []);

  // Filter + sort
  const filteredItems = useMemo(() => {
    let result = [...items];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((i) => i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q));
    }
    switch (sortBy) {
      case "price-asc": result.sort((a, b) => a.price - b.price); break;
      case "price-desc": result.sort((a, b) => b.price - a.price); break;
      case "name": result.sort((a, b) => a.name.localeCompare(b.name)); break;
    }
    return result;
  }, [items, searchQuery, sortBy]);

  // ── place order (with inline confirmation) ──
  const requestPlaceOrder = () => {
    if (shopStatus !== "open") { toast.error("The shop is currently unavailable"); return; }
    const slot = resolvedSlot || activeSlot;
    if (!slot) { toast.error("Please select a time slot on the menu page first"); return; }
    if (cartItems.length === 0) return;
    setConfirmingOrder(true);
  };

  // Auto-set activeSlot from cart when it opens and slot is missing
  useEffect(() => {
    if (showCartDrawer && !activeSlot && resolvedSlot) {
      setActiveSlot(resolvedSlot);
    }
  }, [showCartDrawer, activeSlot, resolvedSlot]);

  const placeOrder = async () => {
    setOrdering(true);
    try {
      const { data } = await api.post("/orders", { items: cartItems });
      clearCart();
      setConfirmingOrder(false);
      setOrderResult(data);
      fireOrderConfetti();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to place order");
    } finally { setOrdering(false); }
  };

  const cancelConfirm = () => setConfirmingOrder(false);

  // ── success state ──
  if (orderResult) {
    return (
      <motion.div className="flex flex-col items-center justify-center py-16 text-center" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
        <motion.div className="text-7xl mb-6" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, delay: 0.1 }}>🎉</motion.div>
        <h1 className="text-2xl font-bold text-kpit-black mb-1">Order Placed!</h1>
        <p className="text-kpit-mid-gray mb-2">Your order has been received</p>
        <div className="bg-kpit-purple-50 border border-kpit-purple-200 rounded-2xl px-6 py-3 mb-6">
          <span className="text-sm text-kpit-dark-gray">Order Code: </span>
          <span className="text-xl font-mono font-bold text-kpit-purple-dark">{orderResult.order_code}</span>
        </div>
        <div className="bg-white border border-kpit-light-gray rounded-2xl p-4 w-full max-w-sm mb-6 text-left">
          <h3 className="text-xs font-semibold text-kpit-mid-gray uppercase tracking-wide mb-3">Order Summary</h3>
          {orderResult.items.map((it, i) => (
            <div key={i} className="flex justify-between text-sm py-1">
              <span>{it.quantity}x {it.name}</span>
              <span className="text-kpit-dark-gray">₹{(it.price * it.quantity).toFixed(2)}</span>
            </div>
          ))}
          <div className="border-t border-kpit-light-gray mt-2 pt-2 flex justify-between font-bold">
            <span>Total</span><span className="text-kpit-purple-dark">₹{orderResult.total.toFixed(2)}</span>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => { setOrderResult(null); setActiveSlot(null); }} className="btn-primary">Order Again</button>
          <button onClick={() => navigate("/orders")} className="px-4 py-2 rounded-lg border border-kpit-light-gray text-kpit-dark-gray hover:bg-kpit-light-gray">Track Order</button>
        </div>
      </motion.div>
    );
  }

  return (
    <div>
      {/* ── Shop status banner (non-user view) ── */}
      {isUser && shopStatus !== "open" && (
        <motion.div className="mb-8 p-8 rounded-2xl text-center" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          style={{ background: shopStatus === "closed" ? "linear-gradient(135deg, #FEE2E2, #FECACA)" : "linear-gradient(135deg, #FEF3C7, #FDE68A)" }}>
          <div className="text-5xl mb-4">{shopStatus === "closed" ? "🚫" : "🕐"}</div>
          <h2 className="text-xl font-bold text-kpit-black mb-2">
            {shopStatus === "closed" ? "Shop Closed" : "We'll Be Right Back!"}
          </h2>
          <p className="text-sm text-kpit-dark-gray max-w-md mx-auto">
            {shopMessage || (shopStatus === "closed" ? "The cafeteria is currently closed. Please check back later." : "The team is on a short break. Orders will resume shortly.")}
          </p>
          {/* Menu still visible below but ordering is blocked */}
        </motion.div>
      )}

      {/* ── Welcome banner — large when no slot, slim when slot active ── */}
      <AnimatePresence mode="wait">
        {!activeSlot ? (
          <motion.div key="hero" className="relative mb-8 rounded-2xl overflow-hidden bg-gradient-to-br from-kpit-purple-primary to-kpit-purple-dark" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 opacity-20"><FloatingParticles /></div>
            <div className="relative p-8 flex items-center justify-between">
              <div>
                <p className="text-kpit-green-primary text-sm font-semibold mb-1 tracking-wider">CHANDU CAFETERIA</p>
                <h1 className="text-3xl font-bold text-white mb-1">Welcome, {user?.name} 👋</h1>
                <p className="text-white/70 text-sm">Pick a time slot and start building your meal.</p>
              </div>
              <div className="text-7xl">🍽️</div>
            </div>
          </motion.div>
        ) : (
          <motion.div key="slim" className="mb-6 flex items-center gap-3 px-1" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <span className="text-xl">{TIME_SLOTS.find((s) => s.key === activeSlot)?.emoji}</span>
            <span className="text-sm font-semibold text-kpit-black">Welcome, {user?.name}</span>
            <span className="text-xs text-kpit-mid-gray">· {TIME_SLOTS.find((s) => s.key === activeSlot)?.label} menu</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Quick Reorder ── */}
      {isUser && activeSlot && activeSlot !== "other" && (() => {
        const slotFavs = favorites.filter((i) => i.time_slot === activeSlot);
        const slotLast = lastOrdered.filter((i) => i.time_slot === activeSlot);
        const slotPop = popularItems.filter((i) => i.time_slot === activeSlot);
        const hasAny = slotFavs.length + slotLast.length + slotPop.length > 0;
        if (!hasAny) return null;
        return (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-kpit-black">⚡ Quick Reorder</h2>
            <div className="flex bg-kpit-light-gray rounded-lg p-0.5">
              {[
                { key: "favorites", label: "My Faves", icon: "❤️", list: slotFavs },
                { key: "last", label: "Last Ordered", icon: "🕐", list: slotLast },
                { key: "popular", label: "Popular", icon: "🔥", list: slotPop },
              ].filter((t) => t.list.length > 0).map((t) => (
                <button key={t.key} onClick={() => setReorderTab(t.key)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${reorderTab === t.key ? "bg-white text-kpit-purple-dark shadow-sm" : "text-kpit-mid-gray hover:text-kpit-black"}`}>
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
          </div>
          <AnimatePresence mode="wait">
            <motion.div key={reorderTab} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              {(reorderTab === "favorites" ? slotFavs : reorderTab === "last" ? slotLast : slotPop).map((item) => (
                <button key={item.menu_item_id || item.name} onClick={() => addToCart(item)}
                  className="bg-white border border-kpit-light-gray rounded-xl p-3 text-left hover:border-kpit-purple-primary/40 hover:shadow-sm transition-all group">
                  <div className="flex items-center gap-2">
                    <FoodImage imageKey={item.name} size="thumb" className="!w-8 !h-8 !rounded-lg" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-kpit-black truncate">{item.name}</p>
                      <p className="text-xs text-kpit-purple-dark font-bold">₹{item.price.toFixed(2)}</p>
                    </div>
                  </div>
                  {item.times_ordered && <p className="text-[10px] text-kpit-mid-gray mt-1">Ordered {item.times_ordered}×</p>}
                </button>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
        );
      })()}

      {/* ── Slot selector ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {TIME_SLOTS.map((slot) => {
          const s = getSlotStatus(slot);
          const timeOpen = s.status === "open" || s.status === "closing";
          const slotClosed = !isSlotOpen(slot.key); // admin closed this slot
          const isOpen = timeOpen && !slotClosed;
          const label = slotClosed ? "Closed" : s.label;
          const color = slotClosed ? "bg-red-100 text-red-700" : s.color;
          return (
            <button key={slot.key}
              onClick={() => {
                if (shopStatus !== "open") { toast.error(shopStatus === "closed" ? "Shop is closed" : "Shop is on a break"); return; }
                if (slotClosed) { toast.error(`${slot.label} has been closed by management`); return; }
                if (!timeOpen) { toast.error(`${slot.label} is currently ${s.label.toLowerCase()}`); return; }
                setActiveSlot(slot.key); setSearchQuery(""); setSortBy("default");
              }}
              className={`p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                activeSlot === slot.key
                  ? "border-kpit-purple-primary bg-kpit-purple-primary text-white shadow-lg"
                  : isOpen
                  ? "border-kpit-light-gray bg-white hover:border-kpit-purple-primary/40 hover:shadow-md"
                  : "border-kpit-light-gray bg-kpit-light-gray/30 opacity-60 cursor-not-allowed"
              }`}>
              <div className="text-2xl mb-1">{slot.emoji}</div>
              <div className="font-semibold text-sm">{slot.label}</div>
              <div className={`text-[10px] mt-1 ${activeSlot === slot.key ? "text-white/70" : "text-kpit-mid-gray"}`}>
                {formatTime(slot.startH, slot.startM)} – {formatTime(slot.endH, slot.endM)}
              </div>
              <div className={`text-[10px] mt-1.5 px-1.5 py-0.5 rounded-full inline-block font-medium ${
                activeSlot === slot.key ? "text-white/80" : color
              }`}>
                {label}
              </div>
            </button>
          );
        })}
      </div>

      {isUser && shopStatus !== "open" && (
        <div className="text-center py-4 mb-4">
          <span className="text-sm text-kpit-mid-gray italic">Menu is currently unavailable — the shop is {shopStatus === "closed" ? "closed" : "on a break"}</span>
        </div>
      )}

      {/* ── Search + Sort ── */}
      {shopStatus === "open" && activeSlot && (
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-kpit-mid-gray text-sm">🔍</span>
            <input
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or category…" className="w-full pl-9 pr-3 py-2.5 text-sm bg-white border border-kpit-light-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-kpit-purple-primary/30 focus:border-kpit-purple-primary" />
          </div>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2.5 text-sm bg-white border border-kpit-light-gray rounded-lg text-kpit-dark-gray focus:outline-none focus:ring-2 focus:ring-kpit-purple-primary/30">
            <option value="default">Sort: Default</option>
            <option value="price-asc">Price: Low → High</option>
            <option value="price-desc">Price: High → Low</option>
            <option value="name">Name: A → Z</option>
          </select>
        </div>
      )}

      {/* ── Menu grid ── */}
      {activeSlot && (
        loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => <SkeletonCard key={i} lines={2} />)}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🍽️</div>
            <p className="text-lg font-semibold text-kpit-black mb-1">No items found</p>
            <p className="text-sm text-kpit-dark-gray">{searchQuery ? "Try a different search term" : "No items available in this slot yet"}</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5" variants={stagger} initial="initial" animate="animate">
              {filteredItems.map((item) => {
                const cartEntry = cart[item._id];
                const inCart = !!cartEntry;
                return (
                  <motion.div key={item._id} variants={fadeUp} layout exit={{ opacity: 0, scale: 0.9 }}>
                    <TiltCard className="card !p-0 overflow-hidden h-full flex flex-col">
                      <div className="relative h-44 overflow-hidden">
                        <FoodImage item={item} className="w-full h-full" />
                        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-kpit-purple-dark font-bold text-sm px-2.5 py-1 rounded-lg shadow-sm">₹{item.price.toFixed(2)}</div>
                        <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded-full">{item.category}</div>
                      </div>
                      <div className="p-4 flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="font-semibold text-kpit-black text-sm mb-0.5">{item.name}</h3>
                          <p className="text-xs text-kpit-dark-gray mb-3 line-clamp-2">{item.description}</p>
                        </div>
                        {/* Inline +/- controls */}
                        {isUser && (
                        <div className="flex items-center gap-2">
                          {inCart && (
                            <>
                              <button onClick={() => removeFromCart(item._id)}
                                className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center font-bold hover:bg-red-100 text-sm">−</button>
                              <span className="w-8 text-center font-bold text-sm text-kpit-purple-dark">{cartEntry.quantity}</span>
                            </>
                          )}
                          <button onClick={() => addToCart(item)}
                            className={`flex-1 py-2 rounded-lg font-semibold text-xs transition-colors ${inCart ? "bg-kpit-green-50 text-kpit-green-dark hover:bg-kpit-green-100" : "bg-kpit-purple-primary text-white hover:bg-kpit-purple-dark"}`}>
                            {inCart ? "+" : "Add to Cart"}
                          </button>
                        </div>
                        )}
                      </div>
                    </TiltCard>
                  </motion.div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        )
      )}

      {/* ── Cart panel (right slide-over, Honda KSIL style) — users only ── */}
      <AnimatePresence>
        {isUser && showCartDrawer && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCartDrawer(false)}
            />

            {/* Panel — slides from right */}
            <motion.div
              className="fixed top-0 right-0 bottom-0 z-50 w-full sm:w-[420px] bg-white shadow-2xl flex flex-col"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-kpit-light-gray">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-kpit-purple-primary/10 rounded-xl flex items-center justify-center">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#753DFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
                      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="font-bold text-kpit-black leading-tight">Your Cart</h2>
                    {cartCount > 0 && (
                      <p className="text-xs text-kpit-mid-gray">{cartCount} item{cartCount !== 1 ? "s" : ""} · ₹{cartTotal.toFixed(2)}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setShowCartDrawer(false)}
                  className="w-9 h-9 rounded-lg bg-kpit-light-gray hover:bg-kpit-light-gray/80 flex items-center justify-center transition-colors"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-kpit-dark-gray">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              {/* Slot info */}
              <div className="px-6 py-3 bg-kpit-purple-primary/5 border-b border-kpit-purple-primary/10">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-kpit-mid-gray">Time slot:</span>
                  {activeSlot ? (
                    <span className="font-semibold text-kpit-purple-dark">
                      {TIME_SLOTS.find((s) => s.key === activeSlot)?.emoji} {TIME_SLOTS.find((s) => s.key === activeSlot)?.label}
                    </span>
                  ) : (
                    <span className="text-red-500 font-medium">Not selected</span>
                  )}
                </div>
              </div>

              {/* Items list */}
              <div className="flex-1 overflow-y-auto px-6 py-4">
                {cartItems.length === 0 && !orderResult ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="w-20 h-20 bg-kpit-light-gray rounded-full flex items-center justify-center mb-4">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-kpit-black mb-1">Your cart is empty</h3>
                    <p className="text-sm text-kpit-mid-gray mb-4">Add delicious items from the menu</p>
                    <button onClick={() => setShowCartDrawer(false)} className="text-sm font-medium text-kpit-purple-dark hover:underline">Browse Menu →</button>
                  </div>
                ) : confirmingOrder ? (
                  /* Inline confirmation before placing */
                  <motion.div className="flex flex-col py-2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="text-center mb-4">
                      <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-3">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                          <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                      </div>
                      <h3 className="font-semibold text-kpit-black mb-1">Confirm your order</h3>
                      <p className="text-xs text-kpit-dark-gray">Please review before placing</p>
                    </div>
                    <div className="bg-kpit-light-gray/50 rounded-xl p-4 mb-4">
                      {cartItems.map((ci) => (
                        <div key={ci.menu_item_id} className="flex justify-between text-sm py-1">
                          <span>{ci.quantity}x {ci.name}</span>
                          <span className="text-kpit-dark-gray">₹{(ci.price * ci.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                      <div className="border-t border-kpit-light-gray mt-2 pt-2 flex justify-between font-bold text-sm">
                        <span>Total</span><span className="text-kpit-purple-dark">₹{cartTotal.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={cancelConfirm}
                        className="flex-1 py-2.5 rounded-xl font-semibold text-sm border-2 border-kpit-light-gray text-kpit-dark-gray hover:border-kpit-purple-primary/30 hover:text-kpit-black transition-colors">
                        ← Back to Cart
                      </button>
                      <button onClick={placeOrder} disabled={ordering}
                        className="flex-1 py-2.5 rounded-xl font-bold text-sm bg-kpit-black text-white hover:bg-kpit-purple-dark active:bg-kpit-purple-dark/90 transition-colors disabled:opacity-50">
                        {ordering ? (
                          <span className="flex items-center justify-center gap-2">
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Placing...
                          </span>
                        ) : "Confirm & Place Order"}
                      </button>
                    </div>
                  </motion.div>
                ) : orderResult ? (
                  /* Success receipt — shown inside the panel */
                  <motion.div className="flex flex-col items-center text-center py-4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <motion.div className="w-16 h-16 bg-kpit-green-50 rounded-full flex items-center justify-center mb-4"
                      initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }}>
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#166534" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </motion.div>
                    <h2 className="text-lg font-bold text-kpit-black mb-1">Order Placed!</h2>
                    <p className="text-sm text-kpit-dark-gray mb-4">Your order has been received</p>
                    <div className="bg-kpit-purple-50 border border-kpit-purple-200 rounded-2xl px-6 py-3 mb-4">
                      <span className="text-xs text-kpit-mid-gray">Order Code</span>
                      <p className="text-xl font-mono font-bold text-kpit-purple-dark">{orderResult.order_code}</p>
                    </div>
                    <div className="w-full bg-kpit-light-gray/50 rounded-xl p-4 mb-5 text-left">
                      <h4 className="text-xs font-semibold text-kpit-mid-gray uppercase tracking-wide mb-2">Order Summary</h4>
                      {orderResult.items.map((it, i) => (
                        <div key={i} className="flex justify-between text-sm py-1">
                          <span>{it.quantity}x {it.name}</span>
                          <span className="text-kpit-dark-gray">₹{(it.price * it.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                      <div className="border-t border-kpit-light-gray mt-2 pt-2 flex justify-between font-bold text-sm">
                        <span>Total</span><span className="text-kpit-purple-dark">₹{orderResult.total.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 w-full">
                      <button onClick={() => { setOrderResult(null); setShowCartDrawer(false); }}
                        className="flex-1 py-2.5 rounded-xl font-semibold text-sm border-2 border-kpit-purple-primary text-kpit-purple-dark hover:bg-kpit-purple-50">
                        Back to Menu
                      </button>
                      <button onClick={() => { setOrderResult(null); setShowCartDrawer(false); navigate("/orders"); }}
                        className="flex-1 py-2.5 rounded-xl font-bold text-sm bg-kpit-black text-white hover:bg-kpit-purple-dark">
                        Track Order
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <AnimatePresence>
                    {cartItems.map((ci) => (
                      <motion.div
                        key={ci.menu_item_id}
                        className="flex items-center gap-4 py-4 border-b border-kpit-light-gray last:border-0"
                        layout
                        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                      >
                        <FoodImage imageKey={ci.name} size="thumb" className="!w-14 !h-14 !rounded-xl flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-kpit-black truncate">{ci.name}</p>
                          <p className="text-xs text-kpit-mid-gray">₹{ci.price.toFixed(2)}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <button onClick={() => removeFromCart(ci.menu_item_id)}
                              className="w-7 h-7 rounded-lg border border-kpit-light-gray text-kpit-dark-gray flex items-center justify-center text-sm hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors">−</button>
                            <span className="w-6 text-center font-semibold text-sm text-kpit-black">{ci.quantity}</span>
                            <button onClick={() => addToCart(ci)}
                              className="w-7 h-7 rounded-lg bg-kpit-purple-primary text-white flex items-center justify-center text-sm hover:bg-kpit-purple-dark transition-colors">+</button>
                          </div>
                        </div>
                        <span className="text-sm font-bold text-kpit-black">₹{(ci.price * ci.quantity).toFixed(2)}</span>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>

              {/* Footer — only when cart has items, not confirming, no order result */}
              {cartItems.length > 0 && !orderResult && !confirmingOrder && (
                <div className="border-t border-kpit-light-gray px-6 py-5 space-y-4 bg-white">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-kpit-dark-gray">Subtotal</span>
                    <span className="text-lg font-bold text-kpit-black">₹{cartTotal.toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-kpit-mid-gray text-center">
                    {!activeSlot ? "⚠️ Select a time slot before ordering" : "Your order will be prepared fresh"}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowCartDrawer(false)}
                      className="flex-1 py-3 rounded-xl font-semibold text-sm border-2 border-kpit-purple-primary text-kpit-purple-dark hover:bg-kpit-purple-50 active:bg-kpit-purple-100 transition-colors"
                    >
                      Add More
                    </button>
                    <button
                      onClick={requestPlaceOrder}
                      disabled={!activeSlot}
                      className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${
                        activeSlot
                          ? "bg-kpit-black text-white hover:bg-kpit-purple-dark active:bg-kpit-purple-dark/90 shadow-lg shadow-kpit-black/10"
                          : "bg-kpit-light-gray text-kpit-mid-gray cursor-not-allowed"
                      }`}
                    >
                      {ordering ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Placing...
                        </span>
                      ) : (
                        `Place Order · ₹${cartTotal.toFixed(2)}`
                      )}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}