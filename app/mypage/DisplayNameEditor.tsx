"use client";

import { useState, useTransition, type FormEvent } from "react";
import { MAX_DISPLAY_NAME_LENGTH } from "@/lib/config";
import { updateDisplayName } from "./actions";
import styles from "./page.module.scss";

/**
 * 表示名の表示と変更。タップすると入力欄に切り替わる。
 * Google プロフィールの名前を初期値に、アプリ内だけで上書きする（Google 側は変更しない）。
 */
export function DisplayNameEditor({ displayName }: { displayName: string }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(displayName);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const startEditing = () => {
    setValue(displayName);
    setError(null);
    setEditing(true);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await updateDisplayName(value);

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setEditing(false);
    });
  };

  if (!editing) {
    return (
      <button type="button" className={styles.settingRow} onClick={startEditing}>
        <span className={styles.settingLabel}>表示名</span>
        <span className={styles.settingValue}>
          <span className={styles.settingName}>{displayName}</span>
          <svg width="12" height="12" viewBox="0 0 14 14" aria-hidden="true">
            <path
              d="M9.5 1.5l3 3L4 13H1v-3z"
              fill="none"
              stroke="#9aa6b2"
              strokeWidth="1.3"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>
    );
  }

  return (
    <form className={styles.nameForm} onSubmit={handleSubmit}>
      <label className={styles.settingLabel} htmlFor="displayName">
        表示名
      </label>
      <input
        id="displayName"
        type="text"
        className={styles.nameInput}
        value={value}
        maxLength={MAX_DISPLAY_NAME_LENGTH}
        onChange={(event) => setValue(event.target.value)}
        autoFocus
        required
      />
      {error !== null && <p className={styles.formError}>{error}</p>}
      <div className={styles.nameActions}>
        <button
          type="button"
          className={styles.secondaryButton}
          disabled={isPending}
          onClick={() => setEditing(false)}
        >
          キャンセル
        </button>
        <button type="submit" className={styles.primaryButton} disabled={isPending}>
          {isPending ? "保存中…" : "保存"}
        </button>
      </div>
    </form>
  );
}
