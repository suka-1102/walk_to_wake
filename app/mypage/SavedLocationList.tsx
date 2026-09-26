"use client";

import { useTransition } from "react";
import { deleteSavedLocation } from "./actions";
import styles from "./page.module.scss";

type SavedLocationItem = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
};

/**
 * 保存した目標地点の一覧と削除。位置情報を必要以上に持ち続けないため、ユーザー自身が消せる
 * （プライバシーポリシーの「削除の方法」）。削除しても進行中・終了済みのチャレンジには影響しない。
 */
export function SavedLocationList({ locations }: { locations: SavedLocationItem[] }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = (location: SavedLocationItem) => {
    const confirmed = window.confirm(
      `「${location.name}」を削除しますか？\n進行中・終了済みのチャレンジには影響しません。`,
    );

    if (!confirmed) {
      return;
    }

    startTransition(async () => {
      await deleteSavedLocation(location.id);
    });
  };

  if (locations.length === 0) {
    return <p className={styles.emptyCard}>保存した目標地点はまだありません</p>;
  }

  return (
    <ul className={styles.card}>
      {locations.map((location) => (
        <li key={location.id} className={styles.locationRow}>
          <div className={styles.locationIcon}>
            <svg width="13" height="13" viewBox="0 0 14 14" aria-hidden="true">
              <path
                d="M7 0C3.7 0 1 2.6 1 5.9 1 9.9 7 14 7 14s6-4.1 6-8.1C13 2.6 10.3 0 7 0z"
                fill="#5c6773"
              />
            </svg>
          </div>
          <div className={styles.locationText}>
            <div className={styles.locationName}>{location.name}</div>
            <div className={styles.locationCoords}>
              {location.latitude.toFixed(3)}, {location.longitude.toFixed(3)}
            </div>
          </div>
          <button
            type="button"
            className={styles.deleteButton}
            aria-label={`${location.name}を削除`}
            disabled={isPending}
            onClick={() => handleDelete(location)}
          >
            <svg width="13" height="14" viewBox="0 0 13 14" aria-hidden="true">
              <path
                d="M1 3h11M4.5 3V1.5A1 1 0 015.5.5h2A1 1 0 018.5 1.5V3M2.5 3l.6 9a1 1 0 001 .9h5.8a1 1 0 001-.9l.6-9"
                fill="none"
                stroke="#c0473f"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </li>
      ))}
    </ul>
  );
}
