import { defineConfig } from "vite";
import { resolve } from "path";
import vue from "@vitejs/plugin-vue";
import vueDevTools from "vite-plugin-vue-devtools";
import tailwindcss from "@tailwindcss/vite";

const appName = "letras";

export default defineConfig({
  plugins: [
    vue(),
    //vueDevTools(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        format: "iife",
        entryFileNames: `${appName}.js`,
        chunkFileNames: `${appName}.[hash].js`,
        assetFileNames: `${appName}.[ext]`,
        inlineDynamicImports: true,
        name: "TagManagerModule",
        extend: true,
      },
    },
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
  },
});
