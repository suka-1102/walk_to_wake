import { prisma } from "@/lib/prisma";

export type SavedLocationOption = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
};

/** 目標地点として選べる、保存済みの地点一覧（新しい順） */
export async function getSavedLocations(userId: string): Promise<SavedLocationOption[]> {
  return prisma.savedLocation.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, latitude: true, longitude: true },
  });
}
