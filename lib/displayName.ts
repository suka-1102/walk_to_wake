import { MAX_DISPLAY_NAME_LENGTH } from "@/lib/config";

export type ValidateDisplayNameResult =
  | { ok: true; name: string }
  | { ok: false; error: "empty" | "tooLong" };

/**
 * 表示名の検証。前後の空白は落とし、空にはできない
 * （Google プロフィールの名前を初期値として持つため、空にする意味がない）。
 * 文字数はコードポイントで数える（絵文字などを 2 文字として数えない）。
 */
export const validateDisplayName = (input: string): ValidateDisplayNameResult => {
  const name = input.trim();

  if (name.length === 0) {
    return { ok: false, error: "empty" };
  }

  if (Array.from(name).length > MAX_DISPLAY_NAME_LENGTH) {
    return { ok: false, error: "tooLong" };
  }

  return { ok: true, name };
};
