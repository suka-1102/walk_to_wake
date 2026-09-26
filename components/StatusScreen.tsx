import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./StatusScreen.module.scss";

/**
 * エラー画面の骨組み（画面モックの NotFound / ServerError）。
 * アイコン円、見出し、補足文、任意の詳細カードを中央に置き、操作（ボタンやリンク）を下に寄せる。
 * 見出し（h1）を兼ねるので、同じページに別の h1 を置かない。
 */
export function StatusScreen({
  tone,
  icon,
  code,
  title,
  children,
  details,
  actions,
}: {
  /** アイコン円の色。404 は控えめな灰、サーバーエラーは黄 */
  tone: "neutral" | "warning";
  icon: ReactNode;
  /** 見出しの上に小さく出す識別子（例: ERROR 404） */
  code?: string;
  title: string;
  /** 補足の文言。改行は呼び出し側の `<br />` で入れる */
  children: ReactNode;
  /** 補足の下に出すカード（エラーの詳細など） */
  details?: ReactNode;
  actions: ReactNode;
}) {
  return (
    <main className={styles.screen}>
      <div className={styles.content}>
        <div className={`${styles.iconDisk} ${tone === "warning" ? styles.iconWarning : ""}`}>
          {icon}
        </div>

        <div className={styles.message}>
          {code !== undefined && <div className={styles.code}>{code}</div>}
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.text}>{children}</p>
        </div>

        {details}
      </div>

      <div className={styles.actions}>{actions}</div>
    </main>
  );
}

/** 主操作。リンクとして使う */
export function StatusPrimaryLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className={styles.primaryButton}>
      {children}
    </Link>
  );
}

/** 主操作。ボタンとして使う */
export function StatusPrimaryButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button type="button" onClick={onClick} className={styles.primaryButton}>
      {children}
    </button>
  );
}

/** 副操作。下線つきの控えめなリンク */
export function StatusSubLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className={styles.subLink}>
      {children}
    </Link>
  );
}

/** 副操作。下線つきの控えめなボタン */
export function StatusSubButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button type="button" onClick={onClick} className={styles.subLink}>
      {children}
    </button>
  );
}

/** エラーの詳細を並べるカード。`rows` は [ラベル, 値] の並び */
export function StatusDetails({ rows }: { rows: [label: string, value: ReactNode][] }) {
  return (
    <dl className={styles.detailCard}>
      {rows.map(([label, value]) => (
        <div key={label} className={styles.detailRow}>
          <dt className={styles.detailLabel}>{label}</dt>
          <dd className={styles.detailValue}>{value}</dd>
        </div>
      ))}
    </dl>
  );
}
