"use client";

import { useRouter } from "next/navigation";
import { StatusSubButton } from "@/components/StatusScreen";

/** 「前のページに戻る」。履歴を1つ戻る */
export function BackButton() {
  const router = useRouter();

  return <StatusSubButton onClick={() => router.back()}>前のページに戻る</StatusSubButton>;
}
