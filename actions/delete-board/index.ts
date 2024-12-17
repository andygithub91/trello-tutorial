"use server";

import { auth } from "@clerk/nextjs";
import { revalidatePath } from "next/cache";
import { DeleteBoard } from "./schema";

import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";

import { InputType, ReturnType } from "./types";
import { redirect } from "next/navigation";
import { createAuditLog } from "@/lib/create-audit-log";
import { ACTION, ENTITY_TYPE } from "@prisma/client";
import { decreaseAvailableCount } from "@/lib/org-limit";
import { checkSubscription } from "@/lib/subscription";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId, orgId } = auth();

  if (!userId || !orgId) {
    return {
      error: "Unauthorized",
    };
  }

  const isPro = await checkSubscription();

  const { id } = data;
  let board;

  try {
    board = await db.board.delete({
      where: {
        id,
        orgId,
      },
    });

    // 對應 actions/create-board/index.ts
    // 如果用戶訂閱就解除看板數量上限的限制，所以不需要計算剩餘多少看板可用的數量，不然會出現奇怪的數字。
    // 例如我訂閱後刪除了20個看板，但是我又取消訂閱了，MAX_FREE_BOARDS - availableCount 會變成 5-(-20)=-25，所以訂閱後就不需要計算剩餘可用數量
    if (!isPro) {
      await decreaseAvailableCount();
    }

    await createAuditLog({
      entityTitle: board.title,
      entityId: board.id,
      entityType: ENTITY_TYPE.BOARD,
      action: ACTION.DELETE,
    });
  } catch (error) {
    return { error: "Failed to delete." };
  }

  revalidatePath(`/organization/${orgId}}`);
  redirect(`/organization/${orgId}`);
};

export const deleteBoard = createSafeAction(DeleteBoard, handler);
