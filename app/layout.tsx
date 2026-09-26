import type { Metadata } from "next";
import { BIZ_UDPGothic, IBM_Plex_Mono } from "next/font/google";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SubPageHeaderSwitch } from "@/components/layout/SubPageHeaderSwitch";
import "./globals.scss";
import styles from "./layout.module.scss";

const bizUdpGothic = BIZ_UDPGothic({
  variable: "--font-biz-udpgothic",
  weight: ["400", "700"],
  subsets: ["latin"],
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Walk to Wake",
  description:
    "決めた時刻までに決めた場所へ足を運ぶことを、デポジットの減額で後押しするアプリ",
};

/**
 * 全ページ共通のヘッダーとフッターをここで付ける。各ページは本文だけを返す。
 * ヘッダーは、モックで「戻る＋タイトル」だけのヘッダーにしている画面では出さない（`SubPageHeaderSwitch`）。
 * ヘッダーはログイン状態でセッションを引くため、配下のページはすべて動的レンダリングになる。
 */
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ja"
      className={`${bizUdpGothic.variable} ${ibmPlexMono.variable}`}
    >
      <body>
        <div className={styles.shell}>
          <div className={styles.column}>
            <SubPageHeaderSwitch>
              <SiteHeader />
            </SubPageHeaderSwitch>
            <div className={styles.main}>{children}</div>
            <SiteFooter />
          </div>
        </div>
      </body>
    </html>
  );
}
