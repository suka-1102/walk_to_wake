"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./HamburgerMenu.module.scss";

type MenuItem = { href: string; label: string; icon: ReactNode };

const ICON_PROPS = {
  width: 20,
  height: 20,
  viewBox: "0 0 20 20",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

/** 行き先は screens.md のメニュー4項目。すべて1階層のパス */
const MENU_ITEMS: MenuItem[] = [
  {
    href: "/",
    label: "ホーム",
    icon: (
      <svg {...ICON_PROPS} aria-hidden="true">
        <path d="M3 9.5L10 3l7 6.5M5 8.5V17h10V8.5" />
      </svg>
    ),
  },
  {
    href: "/check-in",
    label: "チェックイン",
    icon: (
      <svg {...ICON_PROPS} aria-hidden="true">
        <path d="M10 2C6.4 2 3.5 4.9 3.5 8.5 3.5 13.3 10 18 10 18s6.5-4.7 6.5-9.5C16.5 4.9 13.6 2 10 2z" />
        <circle cx="10" cy="8.5" r="2.3" />
      </svg>
    ),
  },
  {
    href: "/challenges",
    label: "履歴",
    icon: (
      <svg {...ICON_PROPS} aria-hidden="true">
        <circle cx="10" cy="10" r="7.5" />
        <path d="M10 5.5V10l3.5 2" />
      </svg>
    ),
  },
  {
    href: "/mypage",
    label: "マイページ",
    icon: (
      <svg {...ICON_PROPS} aria-hidden="true">
        <circle cx="10" cy="6.5" r="3.5" />
        <path d="M3.5 17c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" />
      </svg>
    ),
  },
];

/**
 * ヘッダー右端のハンバーガーメニュー。開くと画面全体をメニューに切り替える（画面モックの Menu）。
 *
 * 開閉状態を持つのはここだけなので、`"use client"` はこのコンポーネントに閉じる。
 * **選択中の項目は現在のパスと完全一致で決める。** `/challenges/new` と `/challenges/[id]` は
 * ホームからも履歴からも開くため、どの項目も選択中にしない（screens.md）。
 */
export function HamburgerMenu() {
  const pathname = usePathname();
  // 開いたときのパスを覚えておき、パスが変わったら（メニューから移動したら）自動で閉じた扱いにする
  const [openedAt, setOpenedAt] = useState<string | null>(null);
  const isOpen = openedAt === pathname;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenedAt(null);
      }
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        className={styles.menuButton}
        aria-label="メニューを開く"
        aria-expanded={isOpen}
        onClick={() => setOpenedAt(pathname)}
      >
        <svg width="18" height="14" viewBox="0 0 18 14" aria-hidden="true">
          <rect width="18" height="2" rx="1" fill="currentColor" />
          <rect y="6" width="18" height="2" rx="1" fill="currentColor" />
          <rect y="12" width="18" height="2" rx="1" fill="currentColor" />
        </svg>
      </button>

      {isOpen && (
        <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="メニュー">
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <span className={styles.panelTitle}>メニュー</span>
              <button
                type="button"
                className={styles.closeButton}
                aria-label="メニューを閉じる"
                onClick={() => setOpenedAt(null)}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
                  <path
                    d="M1 1l12 12M13 1L1 13"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>

            <nav className={styles.items}>
              {MENU_ITEMS.map((item) => {
                const isCurrent = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={isCurrent ? `${styles.item} ${styles.itemCurrent}` : styles.item}
                    aria-current={isCurrent ? "page" : undefined}
                    onClick={() => {
                      // 今いるページを選んだ場合は遷移が起きないので、ここで閉じる
                      if (isCurrent) {
                        setOpenedAt(null);
                      }
                    }}
                  >
                    {item.icon}
                    <span className={styles.itemLabel}>{item.label}</span>
                    {isCurrent && <span className={styles.currentDot} />}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
