"use client";

import { useRef } from "react";
import { deleteAccount } from "./actions";
import pageStyles from "./page.module.scss";
import styles from "./DeleteAccountDialog.module.scss";

/**
 * アカウント削除の確認ダイアログ。専用ページは作らず、マイページの中で完結させる（screens.md）。
 * 取り返しがつかないので、消えるものと、進行中でもデポジットは戻らないことを削除前に明示する。
 */
export function DeleteAccountDialog() {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        type="button"
        className={pageStyles.settingRow}
        onClick={() => dialogRef.current?.showModal()}
      >
        <span className={styles.dangerLabel}>アカウントを削除</span>
        <svg width="7" height="12" viewBox="0 0 7 12" aria-hidden="true">
          <path
            d="M1 1l5 5-5 5"
            fill="none"
            stroke="#c0473f"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <dialog ref={dialogRef} className={styles.dialog} aria-labelledby="delete-account-title">
        <h2 id="delete-account-title" className={styles.title}>
          アカウントを削除しますか？
        </h2>
        <p className={styles.body}>
          保存した目標地点・チャレンジ・チェックインの記録がすべて消えます。消したものは元に戻せません。
        </p>
        <p className={styles.warning}>進行中のチャレンジがあっても、デポジットは戻りません。</p>
        <form action={deleteAccount} className={styles.actions}>
          <button
            type="button"
            className={styles.cancel}
            onClick={() => dialogRef.current?.close()}
          >
            キャンセル
          </button>
          <button type="submit" className={styles.confirm}>
            削除する
          </button>
        </form>
      </dialog>
    </>
  );
}
