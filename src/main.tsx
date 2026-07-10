import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import { ErrorBoundary } from "./components/shared/ErrorBoundary.tsx";
import { logger } from "./utils/logger.ts";
import "./styles/index.css";

// Catch global unhandled exceptions for logs
window.addEventListener("error", (event) => {
  logger.bug("Global Uncaught Exception", event.error, {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
  });
});

window.addEventListener("unhandledrejection", (event) => {
  logger.bug("Unhandled Promise Rejection", event.reason);
});

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
