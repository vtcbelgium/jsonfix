import { defineConfig } from "vitest/config";

export default defineConfig({
  // src/seo.test.ts reads style.css to check contrast; Vitest blanks CSS by default
  test: { css: true },
});
