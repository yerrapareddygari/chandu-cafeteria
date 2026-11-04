import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../api/axios";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ emp_id: "", name: "", email: "", password: "", department: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      await api.post("/auth/register", form);
      setSuccess("Account created! Redirecting to login...");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError(err.response?.data?.detail || "Registration failed");
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
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-kpit-purple-primary rounded-xl flex items-center justify-center font-bold text-2xl text-white mx-auto mb-3">
            KC
          </div>
          <h1 className="text-2xl font-bold text-kpit-black">Create Account</h1>
          <p className="text-kpit-dark-gray text-sm mt-1">Join Chandu Cafeteria</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-kpit-dark-gray mb-1">Employee ID</label>
              <input type="text" className="input-field" placeholder="e.g. KP12345"
                value={form.emp_id} onChange={(e) => setForm({ ...form, emp_id: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-kpit-dark-gray mb-1">Department</label>
              <input type="text" className="input-field" placeholder="e.g. Engineering"
                value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-kpit-dark-gray mb-1">Full Name</label>
            <input type="text" className="input-field" placeholder="Your full name"
              value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-kpit-dark-gray mb-1">Email</label>
            <input type="email" className="input-field" placeholder="your.email@kpit.com"
              value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-kpit-dark-gray mb-1">Password</label>
            <input type="password" className="input-field" placeholder="Min. 6 characters"
              value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} />
          </div>

          {error && <motion.p className="text-red-600 text-sm font-medium" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{error}</motion.p>}
          {success && <motion.p className="text-kpit-green-dark text-sm font-medium" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{success}</motion.p>}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Creating..." : "Create Account"}
          </button>
        </form>

        <p className="text-center text-sm text-kpit-dark-gray mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-kpit-purple-primary font-semibold hover:underline">Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
}