import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Toaster
          position="bottom-center"
          gutter={12}
          toastOptions={{
            duration: 3000,
            style: {
              background: "#161718",
              color: "#B0FF45",
              fontWeight: "600",
              fontSize: "14px",
              borderRadius: "12px",
              padding: "12px 20px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
            },
            success: {
              iconTheme: { primary: "#B0FF45", secondary: "#161718" },
            },
            error: {
              iconTheme: { primary: "#FF6B6B", secondary: "#161718" },
              style: { color: "#FF6B6B" },
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);