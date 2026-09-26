import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getChallengeDetail } from "@/lib/challengeQueries";
import { ChallengeDetailView } from "./ChallengeDetailView";

export const metadata: Metadata = {
  title: "チャレンジ詳細 | Walk to Wake",
};

/** チャレンジ詳細。自分のチャレンジだけを開ける。表示は `ChallengeDetailView` */
export default async function ChallengeDetailPage(props: PageProps<"/challenges/[id]">) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { id } = await props.params;
  const detail = await getChallengeDetail(session.user.id, id, new Date());

  if (detail === null) {
    notFound();
  }

  return (
    <ChallengeDetailView
      challenge={detail.challenge}
      summary={detail.summary}
      records={detail.records}
      canCreateNext={detail.canCreateNext}
    />
  );
}
