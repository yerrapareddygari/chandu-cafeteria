import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../api/axios";
import ConfirmModal from "../components/ConfirmModal";
import OrderTracker from "../components/OrderTracker";
import StatusCharacter from "../components/StatusCharacter";
import FoodImage from "../components/FoodImage";
import SkeletonCard from "../components/SkeletonCard";
import Pagination from "../components/Pagination";
import toast from "react-hot-toast";

const STATUS_COLORS = {
  pending: "text-amber-700 bg-amber-50 border-amber-200",
  preparing: "text-kpit-purple-dark bg-kpit-purple-50 border-kpit-purple-200",
  ready: "text-blue-700 bg-blue-50 border-blue-200",
  paid: "text-kpit-green-dark bg-kpit-green-50 border-kpit-green-200",
  delivered: "text-kpit-mid-gray bg-kpit-light-gray border-kpit-light-gray",
  cancelled: "text-red-700 bg-red-50 border-red-200",
};

const SLOT_LABELS = {
  breakfast: "🌅 Breakfast",
  lunch: "☀️ Lunch",
  snacks: "🍿 Snacks",
  other: "📦 Other",
};

const TABS = [
  { key: "users", label: "User Management" },
  { key: "orders", label: "All Orders" },
];

const TIME_SLOTS = ["all", "breakfast", "lunch", "snacks", "other"];

export default function AdminPage() {
  const [tab, setTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [filterSlot, setFilterSlot] = useState("all");
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState({ open: false, title: "", message: "", action: null, danger: false });
  const [empSearch, setEmpSearch] = useState("");
  const [empOrders, setEmpOrders] = useState(null);
  const [empLoading, setEmpLoading] = useState(false);
  const [userMap, setUserMap] = useState({});
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const LIMIT = 5;

  const askConfirm = (title, message, action, danger = false) => {
    setConfirm({ open: true, title, message, action, danger });
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/users");
      setUsers(data.users);
      // Build a name → emp_id map
      const map = {};
      data.users.forEach((u) => {
        map[u._id] = { name: u.name, emp_id: u.emp_id };
      });
      setUserMap(map);
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const searchEmpOrders = async (e) => {
    e?.preventDefault();
    const trimmed = empSearch.trim();
    if (!trimmed) return;
    setEmpLoading(true);
    setEmpOrders(null);
    try {
      const { data } = await api.get(`/orders/by-emp-id?emp_id=${encodeURIComponent(trimmed)}`);
      setEmpOrders(data);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Employee not found");
      setEmpOrders({ orders: [] });
    } finally {
      setEmpLoading(false);
    }
  };

  const fetchOrders = async (p = 0) => {
    setLoading(true);
    try {
      const [ordersRes, statsRes] = await Promise.all([
        api.get(`/orders/all?skip=${p * LIMIT}&limit=${LIMIT}`),
        api.get("/orders/stats"),
      ]);
      setOrders(ordersRes.data.orders);
      setTotal(ordersRes.data.total);
      setHasMore(ordersRes.data.has_more);
      setStats(statsRes.data);
    } catch {
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const changePage = (p) => {
    setPage(p);
  };

  useEffect(() => {
    if (tab === "users") fetchUsers();
    else fetchOrders(page);
  }, [tab, page]);

  const handleToggleAccess = (user, currentRole) => {
    const isManager = currentRole === "manager";
    askConfirm(
      isManager ? "Revoke Manager Access" : "Grant Manager Access",
      `${isManager ? "Revoke" : "Grant"} manager access for "${user.name}" (${user.emp_id})?`,
      async () => {
        const endpoint = isManager ? "/admin/revoke-access" : "/admin/grant-access";
        try {
          await api.post(endpoint, { user_id: user._id });
          toast.success(isManager ? "Manager access revoked" : "Manager access granted");
          fetchUsers();
        } catch {
          toast.error("Action failed");
        }
      },
      isManager
    );
  };

  // Filter orders by time_slot
  const filteredOrders = filterSlot === "all"
    ? orders
    : orders.filter((o) => o.items?.some((item) => item.time_slot === filterSlot));

  // Compute filtered stats
  const filteredStats = filterSlot === "all" ? stats : {
    ...stats,
    total_revenue: stats?.by_slot?.[filterSlot]?.revenue || 0,
    total_orders: filteredOrders.length,
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-kpit-purple-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <>
    <div>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl font-bold text-kpit-black">Admin Panel</h1>
        <p className="text-kpit-dark-gray text-sm mt-1">Manage users, roles, and view all orders</p>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => { setTab(t.key); setPage(0); }}
            className={`px-5 py-2.5 rounded-lg font-semibold text-sm transition-colors ${tab === t.key ? "bg-kpit-purple-primary text-white" : "bg-white border border-kpit-light-gray text-kpit-dark-gray hover:border-kpit-purple-primary/40"}`}
          >{t.label}</button>
        ))}
      </div>

      {/* Users tab */}
      {tab === "users" && (
        <div className="card overflow-hidden !p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-kpit-purple-primary text-white">
                <tr>
                  <th className="text-left py-3 px-4 font-medium">Employee ID</th>
                  <th className="text-left py-3 px-4 font-medium">Name</th>
                  <th className="text-left py-3 px-4 font-medium hidden sm:table-cell">Email</th>
                  <th className="text-left py-3 px-4 font-medium hidden sm:table-cell">Department</th>
                  <th className="text-center py-3 px-4 font-medium">Role</th>
                  <th className="text-right py-3 px-4 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => (
                  <motion.tr
                    key={u._id}
                    className="border-t border-kpit-light-gray hover:bg-kpit-purple-50 transition-colors"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <td className="py-3 px-4 font-mono font-medium text-kpit-purple-dark">{u.emp_id}</td>
                    <td className="py-3 px-4">{u.name}</td>
                    <td className="py-3 px-4 text-kpit-dark-gray hidden sm:table-cell">{u.email}</td>
                    <td className="py-3 px-4 hidden sm:table-cell">{u.department}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        u.role === "admin" ? "bg-kpit-green-50 text-kpit-green-dark"
                        : u.role === "manager" ? "bg-kpit-purple-100 text-kpit-purple-dark"
                        : "bg-kpit-light-gray text-kpit-mid-gray"
                      }`}>{u.role}</span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {u.role !== "admin" && (
                        <button onClick={() => handleToggleAccess(u, u.role)}
                          className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                            u.role === "manager" ? "bg-red-50 text-red-600 hover:bg-red-100"
                            : "bg-kpit-purple-50 text-kpit-purple-dark hover:bg-kpit-purple-100"
                          }`}>
                          {u.role === "manager" ? "Revoke Manager" : "Make Manager"}
                        </button>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Orders tab */}
      {tab === "orders" && (
        <div>
          {/* Employee ID search */}
          <motion.form
            onSubmit={searchEmpOrders}
            className="flex items-center gap-2 mb-6"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="relative flex-1 max-w-xs">
              <input
                type="text"
                value={empSearch}
                onChange={(e) => setEmpSearch(e.target.value)}
                placeholder="Search by Employee ID…"
                className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-kpit-light-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-kpit-purple-primary/30 focus:border-kpit-purple-primary placeholder:text-kpit-mid-gray"
              />
              <svg className="absolute left-3 top-2.5 w-4 h-4 text-kpit-mid-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <button
              type="submit"
              disabled={empLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-kpit-purple-primary rounded-lg hover:bg-kpit-purple-dark disabled:opacity-50 transition-colors"
            >
              {empLoading ? "Searching…" : "Search"}
            </button>
            {empOrders !== null && (
              <button
                type="button"
                onClick={() => { setEmpOrders(null); setEmpSearch(""); }}
                className="text-xs text-kpit-mid-gray hover:text-kpit-black underline"
              >
                Clear
              </button>
            )}
          </motion.form>

          {/* Employee order results */}
          <AnimatePresence>
            {empOrders !== null && (
              <motion.div
                className="mb-6"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <div className="card !p-4 bg-gradient-to-r from-kpit-purple-50 to-white border border-kpit-purple-100">
                  <h2 className="text-sm font-bold text-kpit-purple-dark mb-2">
                    📋 {empOrders.user_name} ({empSearch}) — {empOrders.orders.length} orders
                  </h2>
                  {empOrders.orders.length === 0 ? (
                    <p className="text-sm text-kpit-dark-gray">No orders found.</p>
                  ) : (
                    <div className="space-y-2 max-h-80 overflow-y-auto">
                      {empOrders.orders.map((o) => (
                        <div key={o._id} className="flex items-center justify-between bg-white rounded-lg p-2 border border-kpit-light-gray">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-kpit-mid-gray">#{o.order_code}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${STATUS_COLORS[o.status]}`}>
                              {STATUS_LABELS[o.status]}
                            </span>
                          </div>
                          <span className="text-xs font-semibold text-kpit-black">₹{o.total.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Stats cards */}
          {stats && (
            <motion.div
              className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="card !p-4 bg-white">
                <div className="text-[10px] text-kpit-mid-gray uppercase tracking-wide font-semibold mb-1">Total Orders</div>
                <div className="text-2xl font-bold text-kpit-black">{filteredStats?.total_orders || stats.total_orders}</div>
                <div className="text-xs text-kpit-green-dark mt-1">{stats.active_orders} active</div>
              </div>
              <div className="card !p-4 bg-white">
                <div className="text-[10px] text-kpit-mid-gray uppercase tracking-wide font-semibold mb-1">Total Revenue</div>
                <div className="text-2xl font-bold text-kpit-purple-dark">
                  ₹{filteredStats?.total_revenue?.toFixed(2) || stats.total_revenue.toFixed(2)}
                </div>
              </div>
              <div className="card !p-4 bg-white">
                <div className="text-[10px] text-kpit-mid-gray uppercase tracking-wide font-semibold mb-1">Pending</div>
                <div className="text-2xl font-bold text-amber-600">{stats.by_status?.pending || 0}</div>
              </div>
              <div className="card !p-4 bg-white">
                <div className="text-[10px] text-kpit-mid-gray uppercase tracking-wide font-semibold mb-1">Delivered Today</div>
                <div className="text-2xl font-bold text-kpit-green-dark">{stats.by_status?.delivered || 0}</div>
              </div>
            </motion.div>
          )}

          {/* Slot breakdown */}
          {stats?.by_slot && Object.keys(stats.by_slot).length > 0 && (
            <motion.div
              className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              {Object.entries(stats.by_slot).map(([slot, s]) => (
                <div key={slot} className="card !p-3 bg-kpit-light-gray/30">
                  <div className="text-xs font-medium text-kpit-dark-gray mb-1">{SLOT_LABELS[slot] || slot}</div>
                  <div className="text-sm font-bold text-kpit-purple-dark">₹{s.revenue.toFixed(2)}</div>
                  <div className="text-[11px] text-kpit-mid-gray">{s.count} item{s.count !== 1 ? "s" : ""}</div>
                </div>
              ))}
            </motion.div>
          )}

          {/* Slot filter pills */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
            {TIME_SLOTS.map((s) => (
              <button key={s} onClick={() => setFilterSlot(s)}
                className={`text-xs px-3 py-1.5 rounded-full font-semibold whitespace-nowrap transition-colors ${
                  filterSlot === s
                    ? "bg-kpit-purple-primary text-white"
                    : "bg-white border border-kpit-light-gray text-kpit-dark-gray hover:border-kpit-purple-primary/40"
                }`}>
                {s === "all" ? "All" : SLOT_LABELS[s] || s}
              </button>
            ))}
          </div>

          {/* Orders list */}
          {filteredOrders.length === 0 ? (
            <motion.div className="text-center py-16 px-4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="text-5xl mb-4">📦</div>
              <p className="text-lg font-semibold text-kpit-black mb-1">No orders found</p>
              <p className="text-sm text-kpit-dark-gray">
                {filterSlot !== "all" ? `No orders in ${filterSlot} slot yet.` : "Orders placed by users will appear here."}
              </p>
            </motion.div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {filteredOrders.map((order, i) => (
                  <motion.div key={order._id} className="card"
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <span className="font-mono font-bold text-kpit-purple-dark bg-kpit-purple-50 px-3 py-1 rounded-lg text-sm">
                          #{order.order_code}
                        </span>
                        <span className="ml-2 text-sm text-kpit-dark-gray">{order.user_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold capitalize border ${STATUS_COLORS[order.status] || "text-kpit-mid-gray"}`}>
                          {order.status}
                        </span>
                        <span className="text-kpit-purple-dark font-bold">₹{order.total.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="mb-3 flex items-center justify-center"><StatusCharacter status={order.status} /></div>
                    <div className="mb-3"><OrderTracker status={order.status} /></div>
                    <div className="space-y-1 mb-2">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="text-kpit-dark-gray">
                            {item.quantity}x {item.name}
                            <span className="text-kpit-mid-gray text-xs ml-1">({item.time_slot})</span>
                          </span>
                          <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    {order.processed_by && order.processed_by.length > 0 && (
                      <div className="border-t border-kpit-light-gray pt-2 mt-2">
                        <div className="text-[10px] text-kpit-mid-gray font-medium mb-1 uppercase tracking-wide">Processing History</div>
                        <div className="space-y-1">
                          {order.processed_by.map((p, pi) => (
                            <div key={pi} className="flex justify-between text-[11px] text-kpit-dark-gray">
                              <span><span className="font-semibold text-kpit-purple-dark">{p.user_name}</span> → {p.status}</span>
                              <span className="text-kpit-mid-gray">{new Date(p.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="text-xs text-kpit-mid-gray mt-2">Ordered: {new Date(order.created_at).toLocaleString()}</div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
          <Pagination page={page} limit={LIMIT} total={total} hasMore={hasMore} loading={loading} onChange={changePage} />
        </div>
      )}
    </div>

    <ConfirmModal open={confirm.open} title={confirm.title} message={confirm.message}
      confirmLabel={confirm.danger ? "Yes, Revoke" : "Confirm"}
      danger={confirm.danger}
      onConfirm={() => { if (confirm.action) confirm.action(); setConfirm({ ...confirm, open: false }); }}
      onCancel={() => setConfirm({ ...confirm, open: false })} />
  </>
  );
}