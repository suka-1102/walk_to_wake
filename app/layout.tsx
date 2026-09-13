import type { Metadata } from "next";
import { BIZ_UDPGothic, IBM_Plex_Mono } from "next/font/google";
import "./globals.scss";

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

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ja"
      className={`${bizUdpGothic.variable} ${ibmPlexMono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
