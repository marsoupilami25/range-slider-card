import { defineConfig } from "vite";
import pkg from "./package.json";

export default defineConfig(({ mode }) => {
  const isDebug = mode === "debug";

  return {
    define: {
      __VERSION__: JSON.stringify(pkg.version),
    },
    build: {
      minify: false,
      sourcemap: isDebug ? "inline" : false,
      lib: {
        entry: "src/flex-slider-card.js",
        name: "FlexSliderCard",
        formats: ["es"],
        fileName: () => "flex-slider-card.js",
      },
      rollupOptions: {
        external: [],
        treeshake: isDebug ? false : true,
        output: {
          codeSplitting: false,
        },
      },
      outDir: "dist",
      emptyOutDir: true,
    },
  };
});