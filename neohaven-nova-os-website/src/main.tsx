import React from "react";
import { createRoot } from "react-dom/client";
import App from "./routes/index";
import Dashboard from "./routes/Dashboard";
import "./styles.css";

const isConsole = window.location.pathname.replace(/\/$/, "") === "/console";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {isConsole ? <Dashboard /> : <App />}
  </React.StrictMode>,
);
