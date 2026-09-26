import { describe, expect, it } from "vitest";
import { MAX_DISPLAY_NAME_LENGTH } from "@/lib/config";
import { validateDisplayName } from "@/lib/displayName";

describe("validateDisplayName", () => {
  it("前後の空白を落として受け付ける", () => {
    expect(validateDisplayName("  すか  ")).toEqual({ ok: true, name: "すか" });
  });

  it("空文字は不可", () => {
    expect(validateDisplayName("")).toEqual({ ok: false, error: "empty" });
  });

  it("空白だけも不可", () => {
    expect(validateDisplayName("   　 ")).toEqual({ ok: false, error: "empty" });
  });

  it("上限ちょうどの文字数は受け付ける", () => {
    expect(validateDisplayName("あ".repeat(MAX_DISPLAY_NAME_LENGTH)).ok).toBe(true);
  });

  it("上限を 1 文字超えたら不可", () => {
    expect(validateDisplayName("あ".repeat(MAX_DISPLAY_NAME_LENGTH + 1))).toEqual({
      ok: false,
      error: "tooLong",
    });
  });

  it("絵文字などのサロゲートペアは 1 文字として数える", () => {
    expect(validateDisplayName("😀".repeat(MAX_DISPLAY_NAME_LENGTH)).ok).toBe(true);
  });
});
