import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
    plugins: [react()],
    build: {
        outDir: "dist",
        emptyOutDir: true,
        lib: {
            entry: resolve(__dirname, "src/content/react/main.jsx"),
            name: "ContentReact",
            formats: ["iife"],
            fileName: () => "content-react.js"
        },
        rollupOptions: {
            output: {
                extend: true,
                inlineDynamicImports: true,
                assetFileNames: "content-react[extname]"
            }
        },
        cssCodeSplit: false
    },
    define: {
        "process.env.NODE_ENV": JSON.stringify("production")
    }
});
