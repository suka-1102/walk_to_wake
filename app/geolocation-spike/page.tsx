import { GeolocationProbe } from "@/app/geolocation-spike/GeolocationProbe";
import styles from "@/app/geolocation-spike/page.module.scss";

export const metadata = {
  title: "位置情報の精度確認",
};

export default function GeolocationSpikePage() {
  return (
    <main className={styles.page}>
      <h1>位置情報の精度確認</h1>
      <p>
        目標地点にしたい場所で計測を開始し、accuracy が何メートルで返るかを確認する。
      </p>
      <GeolocationProbe />
    </main>
  );
}
