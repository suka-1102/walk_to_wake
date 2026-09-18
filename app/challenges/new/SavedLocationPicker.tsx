import styles from "./SavedLocationPicker.module.scss";
import type { SavedLocationOption } from "./queries";

type Props = {
  locations: SavedLocationOption[];
};

/**
 * 保存済みの目標地点を選ぶ一覧。座標は登録時に検証済みのものをそのまま使うため、
 * ここでは精度チェックをやり直さない（AGENTS.md）。
 *
 * 選択操作だけで完結するので "use client" は不要。ラジオボタンの値
 * （`savedLocationId`）は呼び出し元（4.7）のフォームがまとめて読む。
 */
export function SavedLocationPicker({ locations }: Props) {
  if (locations.length === 0) {
    return null;
  }

  return (
    <fieldset className={styles.fieldset}>
      <legend className={styles.legend}>保存した目標地点から選ぶ</legend>
      <ul className={styles.list}>
        {locations.map((location) => (
          <li key={location.id} className={styles.item}>
            <label className={styles.label}>
              <input
                type="radio"
                name="savedLocationId"
                value={location.id}
                className={styles.radio}
              />
              {location.name}
            </label>
          </li>
        ))}
      </ul>
    </fieldset>
  );
}
