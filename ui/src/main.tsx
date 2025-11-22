import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { setupErrorHandlers } from "./utils/errorHandler";
import "./index.css";

// Setup error handlers before rendering
setupErrorHandlers();

createRoot(document.getElementById("root")!).render(<App />);
