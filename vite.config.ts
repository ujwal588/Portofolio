import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: process.env.GITHUB_PAGES === "true" ? "/Portofolio/" : "/",
  plugins: [react()],
  server: {
    allowedHosts: ["subjects-vocals-administration-exploration.trycloudflare.com"],
  },
});
