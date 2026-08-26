import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    passWithNoTests: true,
    // 本番と同じく JST 固定で動かす。時刻の判定はローカル時刻をそのまま読むため。
    // 値の正は lib/config.ts の TIME_ZONE（設定ファイルから import すると Vite が警告を出すため直書き）
    env: { TZ: "Asia/Tokyo" },
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./"),
    },
  },
});
