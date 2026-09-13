import Link from "next/link";
import styles from "./legal.module.scss";

type Block =
  | { type: "p"; text: string }
  | { type: "ol"; items: (string | { text: string; sub: string[] })[] };

export type LegalArticle = {
  heading: string;
  blocks: Block[];
};

type LegalDocumentProps = {
  title: string;
  intro: string;
  articles: LegalArticle[];
  supplementary: string;
};

/**
 * 利用規約・プライバシーポリシー共通の描画。
 *
 * 両文書は「前文 → 条ごとの見出しと本文 → 附則」という同じ構造を持つため、
 * マークアップを共有する。本文の中身（条文そのもの）は各ページ側のデータで持つ。
 */
export function LegalDocument({
  title,
  intro,
  articles,
  supplementary,
}: LegalDocumentProps) {
  return (
    <main className={styles.screen}>
      <Link href="/login" className={styles.backLink}>
        ← ログインへ戻る
      </Link>

      <h1 className={styles.title}>{title}</h1>
      <p className={styles.intro}>{intro}</p>

      {articles.map((article) => (
        <section key={article.heading} className={styles.article}>
          <h2 className={styles.heading}>{article.heading}</h2>
          {article.blocks.map((block, i) =>
            block.type === "p" ? (
              <p key={i} className={styles.paragraph}>
                {block.text}
              </p>
            ) : (
              <ol key={i} className={styles.list}>
                {block.items.map((item, j) =>
                  typeof item === "string" ? (
                    <li key={j}>{item}</li>
                  ) : (
                    <li key={j}>
                      {item.text}
                      <ol className={styles.subList}>
                        {item.sub.map((subItem, k) => (
                          <li key={k}>{subItem}</li>
                        ))}
                      </ol>
                    </li>
                  ),
                )}
              </ol>
            ),
          )}
        </section>
      ))}

      <p className={styles.supplementary}>{supplementary}</p>
    </main>
  );
}
