import React from "react";
import { createRoot } from "react-dom/client";
import App from "./routes/index";
import Dashboard from "./routes/Dashboard";
import EngineeringConsole from "./routes/EngineeringConsole";
import "./styles.css";

const path = window.location.pathname.replace(/\/$/, "") || "/";
const route = path === "/console" ? "console" : path === "/os" ? "os" : "public";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {route === "console" ? <EngineeringConsole /> : route === "os" ? <Dashboard /> : <App />}
  </React.StrictMode>,
);
