import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// En tu PC: siempre Flask en 127.0.0.1:5000. En Docker: VITE_PROXY_API=http://backend:5000
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiTarget = env.VITE_PROXY_API || "http://127.0.0.1:5000";

  const proxy = {
    "/api": {
      target: apiTarget,
      changeOrigin: true,
    },
  };

  return {
    plugins: [react()],
    server: {
      host: "0.0.0.0",
      port: 5173,
      proxy,
    },
    preview: {
      host: "0.0.0.0",
      port: 5173,
      proxy,
    },
  };
});
