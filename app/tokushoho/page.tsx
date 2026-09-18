import type { Metadata } from "next";
import { LegalDocument, type LegalArticle } from "../_legal/LegalDocument";

export const metadata: Metadata = {
  title: "特定商取引法に基づく表記 | Walk to Wake",
};

const articles: LegalArticle[] = [
  {
    heading: "ウェブサービス提供者",
    blocks: [{ type: "p", text: "須賀陽成（以下、「運営者」といいます。）" }],
  },
  {
    heading: "サイト代表者名",
    blocks: [{ type: "p", text: "須賀陽成" }],
  },
  {
    heading: "所在地",
    blocks: [
      { type: "p", text: "ご請求いただき次第、遅滞なく開示いたします。" },
    ],
  },
  {
    heading: "電話番号",
    blocks: [
      { type: "p", text: "ご請求いただき次第、遅滞なく開示いたします。" },
    ],
  },
  {
    heading: "メールアドレス",
    blocks: [{ type: "p", text: "〇〇〇〇@〇〇〇〇" }],
  },
  {
    heading: "販売価格",
    blocks: [
      {
        type: "p",
        text: "ユーザーがチャレンジ作成時に設定するデポジット額（3,000円〜30,000円の範囲）に、デポジット額の3%（1円未満切り捨て）のシステム利用料を加算した金額。",
      },
    ],
  },
  {
    heading: "商品価格以外に必要な料金",
    blocks: [
      { type: "p", text: "なし。決済手数料はシステム利用料に含みます。" },
    ],
  },
  {
    heading: "支払い方法について",
    blocks: [
      {
        type: "p",
        text: "クレジットカード（VISA/MasterCard/American Express/JCB。Stripe を通じた決済）でのお支払いが可能です。",
      },
    ],
  },
  {
    heading: "支払い時期",
    blocks: [
      {
        type: "p",
        text: "チャレンジを作成し、カード決済が行われたタイミングで課金が発生いたします。",
      },
    ],
  },
  {
    heading: "商品の提供時期",
    blocks: [
      {
        type: "p",
        text: "チャレンジ作成ページにて作成ボタンが押され、カード決済が行われた時点で本サービスの利用（チャレンジの開始）が可能になります。",
      },
    ],
  },
  {
    heading: "キャンセル時の対応",
    blocks: [
      { type: "p", text: "運営者からの返金は原則としてできません。" },
      {
        type: "p",
        text: "チャレンジ開始後は、目標地点・期限時刻の変更、中断、一時停止、中途解約はいずれもできません。",
      },
      {
        type: "ol",
        items: [
          "チャレンジが期間満了まで継続した場合：デポジット額から、それまでの失敗回数にペナルティ単価を乗じた額を控除した残額を返金します。システム利用料は返金しません。",
          "チャレンジが早期失敗により終了した場合：デポジット額は返金しません。システム利用料も返金しません。",
        ],
      },
    ],
  },
  {
    heading: "個人情報の取扱いについて",
    blocks: [
      {
        type: "p",
        text: "個人情報の取扱いに関しては、別途定める「プライバシーポリシー」によります。",
      },
    ],
  },
];

export default function TokushohoPage() {
  return (
    <LegalDocument
      title="特定商取引法に基づく表記"
      intro="本サービス「Walk to Wake」に関する、特定商取引法に基づく表記は以下のとおりです。"
      articles={articles}
    />
  );
}
