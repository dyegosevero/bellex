import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// ── Cache-busting: limpa caches antigos quando a versão muda ──
const APP_VERSION = import.meta.env.VITE_APP_VERSION || "dev";
const CACHE_KEY = "app_version";

(async () => {
  const stored = localStorage.getItem(CACHE_KEY);
  if (stored && stored !== APP_VERSION) {
    console.info(`[CacheBust] Versão mudou ${stored} → ${APP_VERSION}. Limpando caches…`);
    // Limpa todos os caches do Service Worker / Cache API
    if ("caches" in window) {
      const names = await caches.keys();
      await Promise.all(names.map((n) => caches.delete(n)));
    }
    // Remove service workers registrados
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    }
    localStorage.setItem(CACHE_KEY, APP_VERSION);
    // Força reload limpo (sem cache)
    window.location.reload();
    return; // não renderiza nesta execução
  }
  localStorage.setItem(CACHE_KEY, APP_VERSION);
})();

createRoot(document.getElementById("root")!).render(<App />);
