import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ emp_id: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", form);
      login(data.token, data.user);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.detail || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-kpit-black px-4">
      <motion.div
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-kpit-purple-primary rounded-xl flex items-center justify-center font-bold text-2xl text-white mx-auto mb-3">
            KC
          </div>
          <h1 className="text-2xl font-bold text-kpit-black">Chandu Cafeteria</h1>
          <p className="text-kpit-dark-gray text-sm mt-1">Sign in to order your meal</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-kpit-dark-gray mb-1">Employee ID</label>
            <input
              type="text"
              name="emp_id"
              className="input-field"
              placeholder="Enter your employee ID"
              value={form.emp_id}
              onChange={(e) => setForm({ ...form, emp_id: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-kpit-dark-gray mb-1">Password</label>
            <input
              type="password"
              name="password"
              className="input-field"
              placeholder="Enter your password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>

          {error && (
            <motion.p
              className="text-red-600 text-sm font-medium"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {error}
            </motion.p>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="text-center text-sm text-kpit-dark-gray mt-6">
          Don&apos;t have an account?{" "}
          <Link to="/register" className="text-kpit-purple-primary font-semibold hover:underline">
            Register here
          </Link>
        </p>
      </motion.div>
    </div>
  );
}