import { z } from "zod";

/*
[K in keyof T]?: string[];
K in keyof T: 這是一個映射類型（mapped type）的語法。它表示對 T 的每個鍵 K，定義一個新的屬性

keyof T: 這個部分表示類型 T 的所有鍵的集合。keyof T 是一個聯合類型（union type），包含 T 中所有鍵的名稱。

K in keyof T: 這是一個映射類型（mapped type）的語法。它表示對 T 的每個鍵 K，定義一個新的屬性。

假設我們有一個類型 Person
type Person = {
  name: string;
  age: number;
  address: string;
};

用 [K in keyof Person]?: string[]; 創建基於 Person 的新類型
對於 Person 類型中的每個鍵 K，在新類型 PersonStringArrays 中，K 變成一個可選的屬性，其值類型為 string[]（字串數組）。
type PersonStringArrays = {
  [K in keyof Person]?: string[];
};

PersonStringArrays 會變成像是下面
type PersonStringArrays = {
  name?: string[] | undefined;
  age?: string[] | undefined;
  address?: string[] | undefined;
}

---

in 用於遍歷（iterate）一個類型的所有屬性鍵（keys），並對每個鍵應用某些變換。
假設我們有一個聯合類型 Keys：
type Keys = "name" | "age" | "address";

我們可以使用映射類型來創建一個新類型，所有鍵都對應一個布爾值（boolean）：
type BooleanMapping = {
  [K in Keys]: boolean;
};

這將生成如下的類型：
type BooleanMapping = {
  name: boolean;
  age: boolean;
  address: boolean;
};

*/

// T 可以從 zod validation 拿到，他會是各個欄位的 errors 的集合
// 把 errors 變成 string array ，裡面的每個 string 都代表一個欄位的 error
export type FieldErrors<T> = {
  [K in keyof T]?: string[];
};

export type ActionState<TInput, TOutput> = {
  fieldErrors?: FieldErrors<TInput>; // TInput 表示 user 輸入的值
  error?: string | null; // server error
  data?: TOutput; // TOutput 表示輸出的資料，像是 prisma type
};

export const createSafeAction = <TInput, TOutput>(
  // z.Schema: https://github.com/colinhacks/zod/issues/2649
  schema: z.Schema<TInput>,
  handler: (validatedData: TInput) => Promise<ActionState<TInput, TOutput>>
) => {
  return async (data: TInput): Promise<ActionState<TInput, TOutput>> => {
    const validationResult = schema.safeParse(data);
    if (!validationResult.success) {
      return {
        fieldErrors: validationResult.error.flatten()
          .fieldErrors as FieldErrors<TInput>,
      };
    }

    return handler(validationResult.data);
  };
};
