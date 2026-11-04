import { Outlet, NavLink, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useState, useEffect } from "react";
import { useShopStatus } from "../hooks/useShopStatus";
import toast from "react-hot-toast";

function useCartCount() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const update = () => {
      try {
        const raw = localStorage.getItem("cart_items");
        if (raw) {
          const items = JSON.parse(raw);
          setCount(Object.values(items).reduce((s, i) => s + (i.quantity || 0), 0));
        } else setCount(0);
      } catch { setCount(0); }
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);
  return count;
}

const navItems = [
  { to: "/dashboard", label: "Menu", roles: ["user", "manager"] },
  { to: "/orders", label: "My Orders", roles: ["user"] },
  { to: "/staff", label: "Staff Panel", roles: ["manager"] },
  { to: "/admin", label: "Admin", roles: ["admin"] },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const cartCount = useCartCount();
  const isUser = user?.role === "user";
  const isManager = user?.role === "manager" || user?.role === "admin";
  const { shopStatus, setStatus, closedSlots, toggleSlot } = useShopStatus();
  const [shopDropdown, setShopDropdown] = useState(false);

  const SLOT_LABELS = { breakfast: "☀️ Breakfast", lunch: "🍛 Lunch", snacks: "🍿 Snacks", other: "🍽️ Other" };

  const visibleNav = navItems.filter((item) => item.roles.includes(user?.role));

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-kpit-light-gray shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-9 h-9 bg-kpit-purple-primary rounded-lg flex items-center justify-center font-bold text-sm text-white">
              KC
            </div>
            <span className="font-bold text-lg tracking-tight text-kpit-black">Chandu Cafeteria</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {visibleNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-kpit-purple-50 text-kpit-purple-dark"
                      : "text-kpit-dark-gray hover:bg-kpit-light-gray"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {/* Shop status toggle — manager/admin only */}
            {isManager && (
              <div className="relative">
                <button
                  onClick={() => setShopDropdown(!shopDropdown)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    shopStatus === "open" ? "bg-kpit-green-50 text-kpit-green-dark" :
                    shopStatus === "break" ? "bg-amber-50 text-amber-700" :
                    "bg-red-50 text-red-700"
                  }`}
                >
                  {shopStatus === "open" ? "🟢 Open" : shopStatus === "break" ? "🟡 Break" : "🔴 Closed"}
                </button>
                {shopDropdown && (
                  <div className="absolute top-full right-0 mt-1 bg-white rounded-xl shadow-xl border border-kpit-light-gray p-2 z-50 min-w-[200px]"
                    onMouseLeave={() => setShopDropdown(false)}>
                    <div className="text-[10px] font-semibold text-kpit-mid-gray uppercase tracking-wide px-2 mb-1">Shop Status</div>
                    {["open", "break", "closed"].map((s) => (
                      <button key={s} onClick={() => { setStatus(s); setShopDropdown(false); toast.success(s === "open" ? "Shop opened" : s === "break" ? "On break" : "Shop closed"); }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                          shopStatus === s ? "bg-kpit-purple-50 text-kpit-purple-dark" : "text-kpit-dark-gray hover:bg-kpit-light-gray"
                        }`}>
                        {s === "open" ? "🟢 Open" : s === "break" ? "🟡 Right Back" : "🔴 Close Shop"}
                      </button>
                    ))}
                    <div className="border-t border-kpit-light-gray my-1.5" />
                    <div className="text-[10px] font-semibold text-kpit-mid-gray uppercase tracking-wide px-2 mb-1">Per-Slot</div>
                    {Object.entries(SLOT_LABELS).map(([key, label]) => (
                      <button key={key} onClick={() => toggleSlot(key)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-between ${
                          closedSlots.includes(key) ? "bg-red-50 text-red-700" : "text-kpit-dark-gray hover:bg-kpit-light-gray"
                        }`}>
                        <span>{label}</span>
                        <span className="text-[10px]">{closedSlots.includes(key) ? "🔒 Closed" : "Open"}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            {/* Cart icon — opens cart drawer on dashboard */}
            {isUser && (
              <button
                onClick={() => {
                  if (window.location.pathname === "/dashboard" || window.location.pathname === "/") {
                    // Already on dashboard — dispatch custom event to open drawer
                    window.dispatchEvent(new CustomEvent("open-cart-drawer"));
                  } else {
                    localStorage.setItem("open_cart", "1");
                    navigate("/dashboard");
                  }
                }}
                className="relative p-2 rounded-lg hover:bg-kpit-light-gray transition-colors"
                title="View Cart"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-kpit-black">
                  <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                </svg>
                {cartCount > 0 && (
                  <motion.span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-kpit-green-primary text-[10px] font-bold text-kpit-black flex items-center justify-center"
                    key={cartCount} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 400 }}>
                    {cartCount}
                  </motion.span>
                )}
              </button>
            )}
            <span className="text-sm hidden sm:inline text-kpit-dark-gray">
              {user?.name} <span className="text-kpit-mid-gray text-xs ml-1">({user?.role})</span>
            </span>
            <button
              onClick={handleLogout}
              className="text-sm px-3 py-1.5 rounded-lg border border-kpit-light-gray text-kpit-dark-gray hover:bg-kpit-light-gray transition-colors"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        <div className="md:hidden flex gap-1 px-4 pb-2 overflow-x-auto">
          {visibleNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? "bg-kpit-purple-50 text-kpit-purple-dark"
                    : "text-kpit-dark-gray hover:bg-kpit-light-gray"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      </header>

      <motion.main
        className="flex-1 max-w-7xl mx-auto w-full px-4 py-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <Outlet />
      </motion.main>

      <footer className="bg-kpit-black text-kpit-mid-gray text-xs text-center py-3">
        &copy; {new Date().getFullYear()} KPIT Technologies Ltd. — Cafeteria App
      </footer>
    </div>
  );
}