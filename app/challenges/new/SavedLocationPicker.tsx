import styles from "./SavedLocationPicker.module.scss";
import type { SavedLocationOption } from "./queries";

type Props = {
  locations: SavedLocationOption[];
  selectedSavedLocationId: string | null;
  isNewSelected: boolean;
  onSelectSaved: (id: string) => void;
  onSelectNew: () => void;
};

const PinIcon = ({ color }: { color: string }) => (
  <svg width="14" height="14" viewBox="0 0 14 14">
    <path
      d="M7 0C3.7 0 1 2.6 1 5.9 1 9.9 7 14 7 14s6-4.1 6-8.1C13 2.6 10.3 0 7 0z"
      fill={color}
    />
  </svg>
);

const CheckBadge = () => (
  <svg width="18" height="18" viewBox="0 0 18 18">
    <circle cx="9" cy="9" r="9" fill="#10192b" />
    <path
      d="M5 9l3 3 5-6"
      fill="none"
      stroke="#fff"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * 目標地点の選択（保存済みの一覧 ＋ 現在地の新規登録）を1枚のカードにまとめて出す。
 *
 * 座標は登録時に検証済みのものをそのまま使うため、ここでは精度チェックをやり直さない
 * （AGENTS.md）。選択状態は呼び出し元（ChallengeForm）が持つ制御コンポーネント。
 */
export function SavedLocationPicker({
  locations,
  selectedSavedLocationId,
  isNewSelected,
  onSelectSaved,
  onSelectNew,
}: Props) {
  return (
    <div className={styles.card}>
      {locations.map((location) => {
        const selected = !isNewSelected && location.id === selectedSavedLocationId;
        return (
          <label
            key={location.id}
            className={`${styles.row} ${selected ? styles.rowSelected : ""}`}
          >
            <input
              type="radio"
              name="savedLocationId"
              value={location.id}
              checked={selected}
              onChange={() => onSelectSaved(location.id)}
              className={styles.hiddenRadio}
            />
            <span className={`${styles.iconBadge} ${selected ? styles.iconBadgeSelected : ""}`}>
              <PinIcon color={selected ? "#10192b" : "#5c6773"} />
            </span>
            <span className={styles.rowBody}>
              <span className={styles.rowName}>{location.name}</span>
              <span className={styles.rowCoords}>
                {location.latitude.toFixed(3)}, {location.longitude.toFixed(3)}
              </span>
            </span>
            {selected && <CheckBadge />}
          </label>
        );
      })}

      <label className={`${styles.newRow} ${isNewSelected ? styles.rowSelected : ""}`}>
        <input
          type="radio"
          checked={isNewSelected}
          onChange={onSelectNew}
          className={styles.hiddenRadio}
        />
        <span className={styles.newIconBadge}>
          <svg width="12" height="12" viewBox="0 0 12 12">
            <path d="M6 0v12M0 6h12" stroke="#5c6773" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </span>
        <span className={styles.newLabel}>現在地を新しく登録する</span>
        {isNewSelected && <CheckBadge />}
      </label>
    </div>
  );
}
