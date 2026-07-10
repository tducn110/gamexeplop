import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import { ErrorBoundary } from "./components/shared/ErrorBoundary.tsx";
import "./styles/index.css";

// Catch global unhandled exceptions for logs
window.addEventListener("error", (event) => {
  console.error("Global uncaught error:", event.error);
});

window.addEventListener("unhandledrejection", (event) => {
  console.error("Global unhandled rejection:", event.reason);
});

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
