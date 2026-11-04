import { useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

let ws = null;
let listeners = [];
let reconnectTimer = null;

function getWsUrl() {
  const apiBase = import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace(/^http/, "ws")
    : "";
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const host = window.location.host;
  return apiBase
    ? `${apiBase}/ws/notifications`
    : `${protocol}//${host}/api/ws/notifications`;
}

function connect(userId) {
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return;

  clearTimeout(reconnectTimer);
  ws = new WebSocket(getWsUrl());

  ws.onopen = () => {
    ws.send(JSON.stringify({ user_id: userId }));
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.type === "notification") {
        listeners.forEach((fn) => fn(data));
        toast(data.message, { icon: "🔔", duration: 5000 });
      }
    } catch { /* ignore */ }
  };

  ws.onclose = () => {
    ws = null;
    reconnectTimer = setTimeout(() => {
      if (userId) connect(userId);
    }, 5000);
  };

  ws.onerror = () => {
    ws?.close();
  };
}

export function useOrderNotifications(onStatusChange) {
  const { user } = useAuth();
  const onStatusChangeRef = useRef(onStatusChange);
  onStatusChangeRef.current = onStatusChange;

  useEffect(() => {
    if (!user?._id) return;
    connect(user._id);

    const handler = (data) => {
      onStatusChangeRef.current?.(data.order_id, data.message);
    };
    listeners.push(handler);

    return () => {
      listeners = listeners.filter((fn) => fn !== handler);
    };
  }, [user?._id]);
}

export { connect };