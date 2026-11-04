import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import ConfirmModal from "../components/ConfirmModal";
import OrderQRModal from "../components/OrderQRModal";
import FoodImage from "../components/FoodImage";
import SkeletonCard from "../components/SkeletonCard";
import Pagination from "../components/Pagination";
import toast from "react-hot-toast";

const TIME_SLOTS = ["breakfast", "lunch", "snacks", "other"];
const ORDER_STATUS_FLOW = ["pending", "preparing", "ready", "paid", "delivered"];

const ITEM_TEMPLATES = [
  { name: "Idli Sambar", category: "South Indian", price: 35, time_slot: "breakfast", description: "Steamed rice cakes with sambar & chutney", image_key: "idli" },
  { name: "Masala Dosa", category: "South Indian", price: 60, time_slot: "breakfast", description: "Crispy rice crepe with spiced potato filling", image_key: "dosa" },
  { name: "Aloo Paratha", category: "North Indian", price: 50, time_slot: "breakfast", description: "Whole wheat flatbread stuffed with spiced potatoes", image_key: "paratha" },
  { name: "Poha", category: "Maharashtrian", price: 30, time_slot: "breakfast", description: "Flattened rice with peanuts, lemon & spices", image_key: "poha" },
  { name: "Upma", category: "South Indian", price: 30, time_slot: "breakfast", description: "Semolina cooked with vegetables & mustard seeds", image_key: "upma" },
  { name: "Veg Sandwich", category: "Continental", price: 45, time_slot: "breakfast", description: "Grilled sandwich with vegetables & cheese", image_key: "sandwich" },
  { name: "Medu Vada", category: "South Indian", price: 35, time_slot: "breakfast", description: "Crispy lentil donuts with sambar", image_key: "vada" },
  { name: "Veg Biryani", category: "Rice", price: 90, time_slot: "lunch", description: "Fragrant basmati rice with vegetables & spices", image_key: "biryani" },
  { name: "Dal Tadka", category: "North Indian", price: 60, time_slot: "lunch", description: "Yellow lentils tempered with cumin & garlic", image_key: "dal" },
  { name: "Paneer Butter Masala", category: "North Indian", price: 100, time_slot: "lunch", description: "Cottage cheese in rich tomato-cream gravy", image_key: "paneer" },
  { name: "Chapati (2 pcs)", category: "Bread", price: 20, time_slot: "lunch", description: "Whole wheat flatbread, tandoor-cooked", image_key: "chapati" },
  { name: "Steamed Rice", category: "Rice", price: 40, time_slot: "lunch", description: "Plain steamed basmati rice", image_key: "rice" },
  { name: "Mix Veg Curry", category: "North Indian", price: 70, time_slot: "lunch", description: "Seasonal vegetables in spiced gravy", image_key: "curry" },
  { name: "Samosa (2 pcs)", category: "Snack", price: 30, time_slot: "snacks", description: "Crispy pastry stuffed with spiced potatoes", image_key: "samosa" },
  { name: "Masala Chai", category: "Beverage", price: 15, time_slot: "snacks", description: "Indian spiced milk tea", image_key: "tea" },
  { name: "Filter Coffee", category: "Beverage", price: 20, time_slot: "snacks", description: "South Indian filter coffee", image_key: "coffee" },
  { name: "Fresh Juice", category: "Beverage", price: 40, time_slot: "snacks", description: "Seasonal fresh fruit juice", image_key: "juice" },
  { name: "Fruit Bowl", category: "Healthy", price: 50, time_slot: "snacks", description: "Mix of seasonal fresh fruits", image_key: "fruit" },
  { name: "Green Salad", category: "Healthy", price: 45, time_slot: "other", description: "Fresh greens with lemon dressing", image_key: "salad" },
  { name: "Veg Pasta", category: "Continental", price: 80, time_slot: "other", description: "Penne pasta in arrabbiata sauce", image_key: "pasta" },
  { name: "Hakka Noodles", category: "Chinese", price: 75, time_slot: "other", description: "Stir-fried noodles with vegetables", image_key: "noodles" },
  { name: "Margherita Pizza", category: "Continental", price: 120, time_slot: "other", description: "Classic cheese pizza with basil", image_key: "pizza" },
  { name: "Veg Burger", category: "Continental", price: 70, time_slot: "other", description: "Vegetable patty burger with fries", image_key: "burger" },
];

export default function StaffPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState("orders");
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [newItem, setNewItem] = useState({ name: "", category: "", price: "", time_slot: "lunch", description: "", image_key: "" });
  const [editItem, setEditItem] = useState(null);
  const [confirm, setConfirm] = useState({ open: false, title: "", message: "", action: null, danger: false });
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const LIMIT = 5;

  const askConfirm = (title, message, action, danger = false) => {
    setConfirm({ open: true, title, message, action, danger });
  };

  const doConfirm = () => {
    if (confirm.action) confirm.action();
    setConfirm({ ...confirm, open: false });
  };

  const fetchOrders = async () => {
    try { const { data } = await api.get(`/orders/active?skip=${page * LIMIT}&limit=${LIMIT}`); setOrders(data.orders); setTotal(data.total || data.orders.length); setHasMore(data.has_more || false); }
    catch { toast.error("Failed to load orders"); }
  };

  const fetchProcessedOrders = async (p = 0) => {
    setLoading(true);
    try { const { data } = await api.get(`/orders/processed?skip=${p * LIMIT}&limit=${LIMIT}`); setOrders(data.orders); setTotal(data.total || data.orders.length); setHasMore(data.has_more || false); }
    catch { toast.error("Failed to load processed orders"); setOrders([]); }
    finally { setLoading(false); }
  };

  const fetchMenu = async () => {
    setLoading(true);
    try { const { data } = await api.get("/menu"); setMenuItems(data.items); }
    catch { toast.error("Failed to load menu"); }
    finally { setLoading(false); }
  };

  const changePage = (p) => {
    setPage(p);
  };

  const switchTab = (t) => {
    setTab(t);
    setPage(0);
  };

  useEffect(() => {
    setLoading(true);
    if (tab === "orders") fetchOrders();
    else if (tab === "history") fetchProcessedOrders(page);
    else fetchMenu();
  }, [tab, page]);
  useEffect(() => {
    if (tab === "orders") { const interval = setInterval(fetchOrders, 15000); return () => clearInterval(interval); }
  }, [tab, page]);

  const selectTemplate = (tpl) => {
    setNewItem({
      name: tpl.name,
      category: tpl.category,
      price: String(tpl.price),
      time_slot: tpl.time_slot,
      description: tpl.description,
      image_key: tpl.image_key || "default",
    });
    setShowTemplates(false);
    setShowAddForm(true);
  };

  const handleUpdateOrderStatus = (orderId, currentStatus) => {
    // At counter: ready → delivered in one step (collect payment + hand over food)
    const nextStatus = currentStatus === "ready" ? "paid" : ORDER_STATUS_FLOW[ORDER_STATUS_FLOW.indexOf(currentStatus) + 1];
    if (!nextStatus) return;
    const buttonLabel = currentStatus === "ready" ? "Confirm payment → delivered" : nextStatus;
    askConfirm("Update Order Status", `Change order status to "${nextStatus}"?`, async () => {
      try {
        await api.put(`/orders/${orderId}/status`, { status: nextStatus });
        // If we confirmed payment at counter, auto-complete to delivered
        if (currentStatus === "ready") {
          await api.put(`/orders/${orderId}/status`, { status: "delivered" });
          toast.success("Payment collected & order delivered ✅");
        } else {
          toast.success(`Order: ${nextStatus}`);
        }
        fetchOrders();
      } catch { toast.error("Failed to update order"); }
    });
  };

  const [commentText, setCommentText] = useState({});

  const sendComment = async (orderId) => {
    const msg = commentText[orderId]?.trim();
    if (!msg) return;
    try {
      await api.post(`/orders/${orderId}/comments`, { message: msg });
      toast.success("Message sent");
      setCommentText({ ...commentText, [orderId]: "" });
      fetchOrders();
    } catch { toast.error("Failed to send message"); }
  };

  const handleDeleteOrder = (order) => {
    askConfirm(
      "Cancel Order",
      `Permanently cancel order #${order.order_code} for ${order.user_name}? The user will be notified.`,
      async () => {
        try { await api.delete(`/orders/${order._id}`); toast.success("Order cancelled"); fetchOrders(); }
        catch { toast.error("Failed to delete order"); }
      },
      true
    );
  };

  const addMenuItem = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...newItem, price: parseFloat(newItem.price) };
      delete payload.image_key;
      payload.image_url = newItem.image_key || "";
      await api.post("/menu", payload);
      toast.success("Menu item added");
      setShowAddForm(false);
      setNewItem({ name: "", category: "", price: "", time_slot: "lunch", description: "", image_key: "" });
      fetchMenu();
    } catch { toast.error("Failed to add item"); }
  };

  const updateMenuItem = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...editItem, price: parseFloat(editItem.price) };
      await api.put(`/menu/${editItem._id}`, payload);
      toast.success("Menu item updated");
      setEditItem(null);
      fetchMenu();
    } catch { toast.error("Failed to update item"); }
  };

  const handleDeleteMenuItem = (id, name) => {
    askConfirm("Delete Menu Item", `Permanently delete "${name}"?`, async () => {
      try { await api.delete(`/menu/${id}`); toast.success("Item deleted"); fetchMenu(); }
      catch { toast.error("Failed to delete item"); }
    }, true);
  };

  const handleToggleAvailability = (item) => {
    askConfirm(item.available ? "Disable Item" : "Enable Item", `${item.available ? "Mark" : "Make"} "${item.name}" as ${item.available ? "unavailable" : "available"}?`, async () => {
      try { await api.put(`/menu/${item._id}`, { available: !item.available }); toast.success(item.available ? "Item unavailable" : "Item available"); fetchMenu(); }
      catch { toast.error("Failed to update"); }
    });
  };

  const filteredTemplates = ITEM_TEMPLATES.filter((t) => t.time_slot === newItem.time_slot);

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl font-bold text-kpit-black">Staff Panel</h1>
        <p className="text-kpit-dark-gray text-sm mt-1">Manage orders and menu</p>
      </motion.div>

      <div className="flex gap-2 mb-6">
        {[{ key: "orders", label: "Active Orders" }, { key: "history", label: "My History" }, { key: "menu", label: "Menu Management" }].map((t) => (
          <button key={t.key} onClick={() => switchTab(t.key)}
            className={`px-5 py-2.5 rounded-lg font-semibold text-sm transition-colors ${tab === t.key ? "bg-kpit-purple-primary text-white" : "bg-white border border-kpit-light-gray text-kpit-dark-gray hover:border-kpit-purple-primary/40"}`}
          >{t.label}</button>
        ))}
      </div>

      {tab === "orders" && (
        <div className="space-y-4">
          {orders.length === 0 ? (
            <motion.div className="text-center py-16 px-4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="text-5xl mb-4">📋</div>
              <p className="text-lg font-semibold text-kpit-black mb-1">No active orders</p>
              <p className="text-sm text-kpit-dark-gray">New orders will appear here automatically</p>
            </motion.div>
          ) : (
          <AnimatePresence>
            {orders.map((order, i) => {
              const nextStatus = ORDER_STATUS_FLOW[ORDER_STATUS_FLOW.indexOf(order.status) + 1];
              const statusColors = {
                pending: "bg-amber-100 text-amber-800",
                preparing: "bg-kpit-purple-50 text-kpit-purple-dark",
                ready: "bg-blue-100 text-blue-700",
                paid: "bg-kpit-green-50 text-kpit-green-dark",
              };
              return (
                <motion.div key={order._id} className="card" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <span className="font-mono font-bold text-kpit-purple-dark bg-kpit-purple-50 px-3 py-1 rounded-lg text-sm">#{order.order_code}</span>
                      <span className="ml-2 text-sm text-kpit-dark-gray">{order.user_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${statusColors[order.status] || "bg-kpit-light-gray text-kpit-mid-gray"}`}>{order.status}</span>
                      <button onClick={() => handleDeleteOrder(order)} className="text-xs px-2 py-1 rounded bg-red-50 text-red-600 hover:bg-red-100 transition-colors" title="Cancel order">✕ Cancel</button>
                    </div>
                  </div>
                  <div className="space-y-1 mb-3">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span>{item.quantity}x {item.name}</span>
                        <span className="text-kpit-dark-gray">₹{(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="border-t pt-1 mt-2 flex justify-between font-bold"><span>Total</span><span className="text-kpit-purple-dark">₹{order.total.toFixed(2)}</span></div>
                  </div>

                  {/* Comments */}
                  {order.comments && order.comments.length > 0 && (
                    <div className="mb-3 space-y-1.5 max-h-32 overflow-y-auto bg-kpit-light-gray/50 rounded-lg p-3">
                      {order.comments.map((c, ci) => (
                        <div key={ci} className="text-xs">
                          <span className={`font-semibold ${c.role === "manager" || c.role === "admin" ? "text-kpit-purple-dark" : "text-kpit-dark-gray"}`}>
                            {c.user_name}:
                          </span>{" "}
                          <span className="text-kpit-dark-gray">{c.message}</span>
                          <span className="text-kpit-mid-gray ml-2">{new Date(c.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Comment input */}
                  <div className="flex gap-2 mb-3">
                    <input
                      className="input-field text-xs py-2"
                      placeholder="Reply to this order..."
                      value={commentText[order._id] || ""}
                      onChange={(e) => setCommentText({ ...commentText, [order._id]: e.target.value })}
                      onKeyDown={(e) => e.key === "Enter" && sendComment(order._id)}
                    />
                    <button onClick={() => sendComment(order._id)} className="text-xs px-3 py-2 rounded-lg bg-kpit-purple-50 text-kpit-purple-dark hover:bg-kpit-purple-100 transition-colors font-semibold flex-shrink-0">
                      Send
                    </button>
                  </div>

                  {/* QR code for ready orders — user shows this to pay */}
                  {order.status === "ready" && (
                    <div className="mb-3 bg-blue-50 rounded-xl p-3 flex items-center gap-3">
                      <OrderQRModal order={order} compact />
                      <div>
                        <p className="text-xs font-semibold text-blue-800 mb-0.5">Ready for pickup</p>
                        <p className="text-[10px] text-blue-600">User shows this QR at counter to pay</p>
                      </div>
                    </div>
                  )}

                  {nextStatus && (
                    <button onClick={() => handleUpdateOrderStatus(order._id, order.status)} className="btn-primary text-sm py-2 w-full">
                      {nextStatus === "preparing" && "Start Preparing"}
                      {nextStatus === "ready" && "Mark as Ready"}
                      {order.status === "ready" && "💰 Collect Payment"}
                      {order.status === "paid" && "✓ Mark Collected"}
                    </button>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
          )}
          <Pagination page={page} limit={LIMIT} total={total} hasMore={hasMore} loading={loading} onChange={changePage} />
        </div>
      )}

      {tab === "history" && (
        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-kpit-purple-primary border-t-transparent" />
            </div>
          ) : orders.length === 0 ? (
            <motion.div
              className="text-center py-16 px-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="text-5xl mb-4">📋</div>
              <p className="text-lg font-semibold text-kpit-black mb-1">No orders processed yet</p>
              <p className="text-sm text-kpit-dark-gray max-w-xs mx-auto">
                Orders you handle from the <span className="font-medium text-kpit-purple-dark">Active Orders</span> tab will appear here with your processing history.
              </p>
            </motion.div>
          ) : (
            <AnimatePresence>
              {orders.map((order, i) => (
              <motion.div
                key={order._id}
                className="card opacity-80 hover:opacity-100 transition-opacity"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="font-mono font-bold text-kpit-purple-dark bg-kpit-purple-50 px-3 py-1 rounded-lg text-sm">
                      #{order.order_code}
                    </span>
                    <span className="ml-2 text-sm text-kpit-dark-gray">{order.user_name}</span>
                  </div>
                  <span className="text-kpit-purple-dark font-bold">₹{order.total.toFixed(2)}</span>
                </div>

                <div className="space-y-1 mb-2">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-kpit-dark-gray">{item.quantity}x {item.name}</span>
                      <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                {order.processed_by && (
                  <div className="border-t border-kpit-light-gray pt-2 mt-2">
                    <div className="text-[10px] text-kpit-mid-gray font-medium mb-1 uppercase tracking-wide">
                      You processed
                    </div>
                    <div className="space-y-0.5">
                      {order.processed_by
                        .filter((p) => p.user_id === user?._id)
                        .map((p, pi) => (
                          <div key={pi} className="flex justify-between text-[11px]">
                            <span className="text-kpit-purple-dark font-semibold">→ {p.status}</span>
                            <span className="text-kpit-mid-gray">
                              {new Date(p.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                <div className="text-xs text-kpit-mid-gray mt-2">
                  {new Date(order.created_at).toLocaleDateString()}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          )}
          <Pagination page={page} limit={LIMIT} total={total} hasMore={hasMore} loading={loading} onChange={changePage} />
        </div>
      )}

      {tab === "menu" && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-kpit-dark-gray">{menuItems.length} items</span>
            <div className="flex gap-2">
              <button onClick={() => { setShowTemplates(!showTemplates); setShowAddForm(false); }} className="btn-outline text-sm">
                {showTemplates ? "Hide Templates" : "📋 Choose from Templates"}
              </button>
              <button onClick={() => { setShowAddForm(!showAddForm); setShowTemplates(false); }} className="btn-primary text-sm">
                {showAddForm ? "Cancel" : "+ Custom Item"}
              </button>
            </div>
          </div>

          <AnimatePresence>
            {showTemplates && (
              <motion.div className="mb-6" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                <h3 className="font-semibold text-kpit-black mb-3">Select a template — click to fill the form</h3>
                <div className="flex gap-2 mb-3 flex-wrap">
                  {TIME_SLOTS.map((s) => (
                    <button key={s} onClick={() => setNewItem({ ...newItem, time_slot: s })}
                      className={`text-xs px-3 py-1 rounded-full capitalize font-medium transition-colors ${newItem.time_slot === s ? "bg-kpit-purple-primary text-white" : "bg-kpit-light-gray text-kpit-dark-gray hover:bg-kpit-purple-50"}`}>
                      {s}
                    </button>
                  ))}
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredTemplates.map((tpl, i) => (
                    <motion.button
                      key={i}
                      onClick={() => selectTemplate(tpl)}
                      className="card text-left hover:ring-2 hover:ring-kpit-purple-primary/30 transition-all !p-0 overflow-hidden"
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                    >
                      <FoodImage imageKey={tpl.image_key} size="card" />
                      <div className="p-3">
                        <div className="font-semibold text-sm text-kpit-black">{tpl.name}</div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-kpit-dark-gray capitalize">{tpl.time_slot} • {tpl.category}</span>
                          <span className="text-kpit-purple-dark font-bold text-sm">₹{tpl.price}</span>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                  {filteredTemplates.length === 0 && (
                    <p className="text-sm text-kpit-dark-gray col-span-full py-4 text-center">No templates for "{newItem.time_slot}" slot. Pick a different time slot above.</p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showAddForm && (
              <motion.form onSubmit={addMenuItem} className="card mb-6 space-y-3" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                <h3 className="font-semibold">{newItem.image_key ? "Add Template Item" : "New Menu Item"}</h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  <input className="input-field" placeholder="Item name" value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} required />
                  <input className="input-field" placeholder="Category" value={newItem.category} onChange={(e) => setNewItem({ ...newItem, category: e.target.value })} />
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <input className="input-field" type="number" step="0.01" placeholder="Price (₹)" value={newItem.price} onChange={(e) => setNewItem({ ...newItem, price: e.target.value })} required />
                  <select className="input-field" value={newItem.time_slot} onChange={(e) => setNewItem({ ...newItem, time_slot: e.target.value })}>
                    {TIME_SLOTS.map((s) => (<option key={s} value={s} className="capitalize">{s}</option>))}
                  </select>
                </div>
                <input className="input-field" placeholder="Description" value={newItem.description} onChange={(e) => setNewItem({ ...newItem, description: e.target.value })} />
                {newItem.image_key && (
                  <div className="rounded-lg overflow-hidden h-28">
                    <FoodImage imageKey={newItem.image_key} size="full" />
                  </div>
                )}
                <button type="submit" className="btn-primary w-full">Add Item</button>
              </motion.form>
            )}
          </AnimatePresence>

          {loading ? (
            <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-4 border-kpit-purple-primary border-t-transparent" /></div>
          ) : (
            <div className="space-y-3">
              {menuItems.map((item, i) => (
                <motion.div key={item._id} className="card flex items-center gap-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
                  <FoodImage imageKey={item.image_key || item.image_url || "default"} size="thumb" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold truncate">{item.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${item.available ? "bg-kpit-green-50 text-kpit-green-dark" : "bg-red-50 text-red-600"}`}>
                        {item.available ? "Available" : "Unavailable"}
                      </span>
                    </div>
                    <div className="text-sm text-kpit-dark-gray flex gap-3">
                      <span>₹{item.price.toFixed(2)}</span>
                      <span className="capitalize">{item.time_slot}</span>
                      {item.category && <span>• {item.category}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => handleToggleAvailability(item)} className="text-xs px-2 py-1 rounded border border-kpit-light-gray hover:bg-kpit-light-gray transition-colors">
                      {item.available ? "Disable" : "Enable"}
                    </button>
                    <button onClick={() => setEditItem({ ...item, price: String(item.price) })} className="text-xs px-2 py-1 rounded bg-kpit-purple-50 text-kpit-purple-dark hover:bg-kpit-purple-100 transition-colors">Edit</button>
                    <button onClick={() => handleDeleteMenuItem(item._id, item.name)} className="text-xs px-2 py-1 rounded bg-red-50 text-red-600 hover:bg-red-100 transition-colors">Delete</button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          <AnimatePresence>
            {editItem && (
              <motion.div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditItem(null)}>
                <motion.form onSubmit={updateMenuItem} className="bg-white rounded-2xl p-6 w-full max-w-md space-y-3" initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={(e) => e.stopPropagation()}>
                  <h3 className="font-semibold text-lg">Edit Item</h3>
                  <input className="input-field" value={editItem.name} onChange={(e) => setEditItem({ ...editItem, name: e.target.value })} required />
                  <div className="grid grid-cols-2 gap-3">
                    <input className="input-field" value={editItem.category} onChange={(e) => setEditItem({ ...editItem, category: e.target.value })} />
                    <input className="input-field" type="number" step="0.01" value={editItem.price} onChange={(e) => setEditItem({ ...editItem, price: e.target.value })} required />
                  </div>
                  <select className="input-field" value={editItem.time_slot} onChange={(e) => setEditItem({ ...editItem, time_slot: e.target.value })}>
                    {TIME_SLOTS.map((s) => (<option key={s} value={s} className="capitalize">{s}</option>))}
                  </select>
                  <textarea className="input-field" rows="2" placeholder="Description" value={editItem.description || ""} onChange={(e) => setEditItem({ ...editItem, description: e.target.value })} />
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setEditItem(null)} className="btn-outline flex-1">Cancel</button>
                    <button type="submit" className="btn-primary flex-1">Save</button>
                  </div>
                </motion.form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      <ConfirmModal open={confirm.open} title={confirm.title} message={confirm.message}
        confirmLabel={confirm.danger ? "Yes, Delete" : "Confirm"} danger={confirm.danger}
        onConfirm={doConfirm} onCancel={() => setConfirm({ ...confirm, open: false })} />
    </div>
  );
}