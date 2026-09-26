"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LocationAcquisition } from "@/components/geolocation/LocationAcquisition";
import type { GeolocationSample } from "@/components/geolocation/useGeolocation";
import { CHECK_IN_START_HOUR, MAX_DEPOSIT_YEN, MIN_DEPOSIT_YEN } from "@/lib/config";
import { SavedLocationPicker } from "./SavedLocationPicker";
import type { SavedLocationOption } from "./queries";
import { createChallenge, type CreateChallengeTarget } from "./actions";
import styles from "./page.module.scss";

type Props = {
  savedLocations: SavedLocationOption[];
};

type TargetMode = "existing" | "new";

/** デポジット額のステッパーが1回のタップで増減させる額。しきい値ではなく UI 上の刻み幅 */
const DEPOSIT_STEP_YEN = 1000;

const deadlineStartTime = `${String(CHECK_IN_START_HOUR).padStart(2, "0")}:00`;

/** `<input type="date">` の min 属性用に、ローカル日付を YYYY-MM-DD で表す */
const formatDateInput = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const tomorrow = (() => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date;
})();

const minStartDate = formatDateInput(tomorrow);

/**
 * 目標地点・期限時刻・期間・デポジット額をまとめて受け取るフォーム。
 * 目標地点だけ独立した画面を持たない設計のため、登録（新規時）と選択をここに含める。
 *
 * 座標の取得・選択方法の切り替えは state が要るため "use client"。
 * 検証は 4.5 の `validateChallengeInput` にサーバー側で任せ、ここでは
 * 必須項目が埋まっているかどうかの最低限のチェックだけ行う。
 */
export function ChallengeForm({ savedLocations }: Props) {
  const router = useRouter();
  const [targetMode, setTargetMode] = useState<TargetMode>(
    savedLocations.length > 0 ? "existing" : "new",
  );
  const [selectedSavedLocationId, setSelectedSavedLocationId] = useState<string | null>(
    savedLocations[0]?.id ?? null,
  );
  const [acquired, setAcquired] = useState<GeolocationSample | null>(null);
  const [depositYen, setDepositYen] = useState(MIN_DEPOSIT_YEN);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const adjustDeposit = (delta: number) => {
    setDepositYen((current) =>
      Math.min(MAX_DEPOSIT_YEN, Math.max(MIN_DEPOSIT_YEN, current + delta)),
    );
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);

    let target: CreateChallengeTarget;

    if (targetMode === "existing") {
      if (selectedSavedLocationId === null) {
        setError("目標地点を選んでください");
        return;
      }
      target = { type: "existing", savedLocationId: selectedSavedLocationId };
    } else {
      if (acquired === null) {
        setError("現在地を取得してください");
        return;
      }
      const name = String(formData.get("newLocationName") ?? "").trim();
      if (name === "") {
        setError("目標地点の名前を入力してください");
        return;
      }
      target = {
        type: "new",
        name,
        latitude: acquired.latitude,
        longitude: acquired.longitude,
        accuracy: acquired.accuracy,
      };
    }

    const deadlineTime = String(formData.get("deadlineTime") ?? "");
    const [deadlineHourText, deadlineMinuteText] = deadlineTime.split(":");
    const startDateText = String(formData.get("startDate") ?? "");
    const endDateText = String(formData.get("endDate") ?? "");

    if (deadlineHourText === undefined || startDateText === "" || endDateText === "") {
      setError("入力内容を確認してください");
      return;
    }

    setSubmitting(true);

    const result = await createChallenge({
      target,
      deadlineHour: Number(deadlineHourText),
      deadlineMinute: Number(deadlineMinuteText),
      startDate: new Date(`${startDateText}T00:00:00`),
      endDate: new Date(`${endDateText}T00:00:00`),
      depositYen,
    });

    if (!result.ok) {
      setSubmitting(false);
      setError(result.error);
      return;
    }

    router.push("/");
  };

  return (
    <main className={styles.screen}>
      <div className={styles.header}>
        <Link href="/" className={styles.backButton} aria-label="戻る">
          <svg width="8" height="14" viewBox="0 0 8 14">
            <path
              d="M7 1L1 7l6 6"
              fill="none"
              stroke="#10192b"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
        <span className={styles.title}>チャレンジ作成</span>
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.section}>
          <div className={styles.sectionTitle}>目標地点</div>

          {targetMode === "existing" ? (
            <SavedLocationPicker
              locations={savedLocations}
              selectedSavedLocationId={selectedSavedLocationId}
              isNewSelected={false}
              onSelectSaved={(id) => {
                setSelectedSavedLocationId(id);
                setTargetMode("existing");
              }}
              onSelectNew={() => setTargetMode("new")}
            />
          ) : (
            <>
              {savedLocations.length > 0 && (
                <SavedLocationPicker
                  locations={savedLocations}
                  selectedSavedLocationId={selectedSavedLocationId}
                  isNewSelected
                  onSelectSaved={(id) => {
                    setSelectedSavedLocationId(id);
                    setTargetMode("existing");
                  }}
                  onSelectNew={() => setTargetMode("new")}
                />
              )}
              <div className={styles.newLocationCard}>
                {acquired === null ? (
                  <LocationAcquisition onAcquired={setAcquired} />
                ) : (
                  <div className={styles.acquiredLocation}>
                    <p className={styles.acquiredNote}>
                      現在地を取得しました（精度 約{Math.round(acquired.accuracy)}m）
                    </p>
                    <input
                      type="text"
                      name="newLocationName"
                      className={styles.nameInput}
                      placeholder="目標地点の名前"
                      maxLength={50}
                      required
                    />
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className={styles.section}>
          <div className={styles.sectionTitle}>チェックイン期限時刻</div>
          <div className={styles.card}>
            <div className={styles.rowBetween}>
              <span className={styles.rowHint}>毎朝 {deadlineStartTime} 〜 期限まで</span>
              <input
                type="time"
                name="deadlineTime"
                className={styles.timeInput}
                min={deadlineStartTime}
                defaultValue="07:00"
                required
              />
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionTitle}>チャレンジ期間</div>
          <div className={styles.card}>
            <div className={styles.rowBetween}>
              <input
                type="date"
                name="startDate"
                className={styles.dateInput}
                min={minStartDate}
                defaultValue={minStartDate}
                required
              />
              <span className={styles.rowSeparator}>〜</span>
              <input
                type="date"
                name="endDate"
                className={styles.dateInput}
                min={minStartDate}
                defaultValue={minStartDate}
                required
              />
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionTitle}>デポジット額</div>
          <div className={styles.depositCard}>
            <div className={styles.depositRow}>
              <button
                type="button"
                className={styles.depositStepper}
                onClick={() => adjustDeposit(-DEPOSIT_STEP_YEN)}
                aria-label="デポジット額を減らす"
              >
                −
              </button>
              <div className={styles.depositValue}>
                <span className={styles.depositYenMark}>¥</span>
                <span className={styles.depositAmount}>
                  {depositYen.toLocaleString("ja-JP")}
                </span>
              </div>
              <button
                type="button"
                className={styles.depositStepper}
                onClick={() => adjustDeposit(DEPOSIT_STEP_YEN)}
                aria-label="デポジット額を増やす"
              >
                ＋
              </button>
            </div>
            <p className={styles.depositHint}>
              ¥{MIN_DEPOSIT_YEN.toLocaleString("ja-JP")} 〜 ¥
              {MAX_DEPOSIT_YEN.toLocaleString("ja-JP")} の範囲で設定してください
            </p>
          </div>
        </div>

        {error !== null && <p className={styles.error}>{error}</p>}

        <button type="submit" className={styles.submitButton} disabled={submitting}>
          {submitting ? "作成中…" : "チャレンジを作成する"}
        </button>
      </form>
    </main>
  );
}
