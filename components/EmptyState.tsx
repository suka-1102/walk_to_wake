import type { ReactNode } from "react";
import styles from "./EmptyState.module.scss";

type EmptyStateIcon = "clock" | "pin" | "history";

/** 空の状態のアイコン。線の色と太さは画面モックの HomeEmpty / NotFound に揃える */
function Icon({ name }: { name: EmptyStateIcon }) {
  const common = {
    fill: "none",
    stroke: "#9aa6b2",
    strokeWidth: 1.6,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  } as const;

  return (
    <svg width="40" height="40" viewBox="0 0 24 24" aria-hidden="true">
      {name === "clock" && (
        <>
          <circle cx="12" cy="12" r="10" {...common} />
          <path d="M12 6.5V12l3.5 3.5" {...common} />
        </>
      )}
      {name === "pin" && (
        <>
          <path d="M12 2C7.6 2 4 5.6 4 10c0 6 8 12 8 12s8-6 8-12c0-4.4-3.6-8-8-8z" {...common} />
          <circle cx="12" cy="10" r="3" {...common} />
        </>
      )}
      {name === "history" && (
        <>
          <rect x="4" y="3" width="16" height="18" rx="3" {...common} />
          <path d="M8 9h8M8 13h8M8 17h5" {...common} />
        </>
      )}
    </svg>
  );
}

/**
 * 表示するものがないときの画面（画面モックの HomeEmpty）。
 * 画面の見出し（h1）を兼ねるので、同じページに別の h1 を置かない。
 * 行き先が必要な画面だけ `children` にボタンを渡す。
 */
export function EmptyState({
  icon,
  title,
  children,
  action,
}: {
  icon: EmptyStateIcon;
  title: string;
  /** 補足の文言。改行は呼び出し側の `<br />` で入れる */
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className={styles.empty}>
      <div className={styles.iconDisk}>
        <Icon name={icon} />
      </div>
      <div>
        <h1 className={styles.title}>{title}</h1>
        {children !== undefined && <p className={styles.text}>{children}</p>}
      </div>
      {action}
    </div>
  );
}
