"use server";

import { auth } from "@clerk/nextjs";
import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";

import { UpdateListOrder } from "./schema";
import { InputType, ReturnType } from "./types";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId, orgId } = auth();

  if (!userId || !orgId) {
    return {
      error: "Unauthorized",
    };
  }

  const { items, boardId } = data;
  let lists;

  try {
    const transaction = items.map((list) =>
      db.list.update({
        where: {
          id: list.id,
          board: {
            orgId,
          },
        },
        data: {
          order: list.order,
        },
      })
    );

    // 什么是事务 (transaction)
    // 事务是在数据库中执行的一系列操作，这些操作要么全部成功提交，要么全部失败并回滚。事务确保数据库不会处于部分更新的中间状态。
    // 原子性是事务的一个关键特性，表示事务中的所有操作被视为一个不可分割的单元。
    // transaction 数组： 你使用 map 方法创建了一个包含多个数据库更新操作的数组，每个操作都更新一个 list 项的顺序。
    // transaction 數組中只要有一個 list.order 沒有成功被更新則所有 transaction 數組中 list.order 更新全部 roll back
    lists = await db.$transaction(transaction);
  } catch (error) {
    return { error: "Failed to reorder." };
  }

  revalidatePath(`/board/${boardId}`);
  return { data: lists };
};

export const updateListOrder = createSafeAction(UpdateListOrder, handler);
