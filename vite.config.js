import { defineConfig } from "vite";
import pkg from "./package.json";

export default defineConfig({
  define: {
    __VERSION__: JSON.stringify(pkg.version),
  },
  build: {
    minify: false,
    lib: {
      entry: "src/flex-slider-card.js",
      name: "FlexSliderCard",
      formats: ["es"],
      fileName: () => "flex-slider-card.js",
    },
    rollupOptions: {
      external: [],
      output: {
        inlineDynamicImports: true,
      },
    },
    outDir: "dist",
    emptyOutDir: true,
  },
});