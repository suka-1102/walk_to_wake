import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getSavedLocations } from "./queries";
import { ChallengeForm } from "./ChallengeForm";

export const metadata: Metadata = {
  title: "チャレンジを作成 | Walk to Wake",
};

export default async function NewChallengePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const savedLocations = await getSavedLocations(session.user.id);

  return <ChallengeForm savedLocations={savedLocations} />;
}
