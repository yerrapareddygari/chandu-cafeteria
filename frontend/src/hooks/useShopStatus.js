import { useState, useEffect, useCallback } from "react";
import api from "../api/axios";

export function useShopStatus() {
  const [shopStatus, setShopStatus] = useState("open");
  const [shopMessage, setShopMessage] = useState(null);
  const [closedSlots, setClosedSlots] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchStatus = useCallback(async () => {
    try {
      const { data } = await api.get("/shop/status");
      setShopStatus(data.status);
      setShopMessage(data.message);
      setClosedSlots(data.closed_slots || []);
    } catch { /* default to open */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  const setStatus = async (status) => {
    try {
      const { data } = await api.put("/shop/status", { status });
      setShopStatus(data.status);
      setShopMessage(data.message);
      setClosedSlots(data.closed_slots || []);
    } catch { /* ignore */ }
  };

  const toggleSlot = async (slotKey) => {
    const next = closedSlots.includes(slotKey)
      ? closedSlots.filter((s) => s !== slotKey)
      : [...closedSlots, slotKey];
    try {
      const { data } = await api.put("/shop/status", { closed_slots: next });
      setClosedSlots(data.closed_slots || []);
    } catch { /* ignore */ }
  };

  const isSlotClosed = (slotKey) => closedSlots.includes(slotKey);

  return { shopStatus, shopMessage, closedSlots, loading, setStatus, toggleSlot, isSlotClosed, refresh: fetchStatus };
}