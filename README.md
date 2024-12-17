## Fonts

### How to import local fonts using nextjs

```tsx
import localFont from "next/font/local";
const headingFont = localFont({
  src: "../../public/fonts/font.woff2",
});
const MarketingPage = () => {
  return <div className={headingFont.className}></div>;
};
```

### How to import google fonts using nextjs

```tsx
import { Poppins } from "next/font/google";
const textFont = Poppins({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});
const MarketingPage = () => {
  return <div className={textFont.className}></div>;
};
```

## Auth

### Clerk

#### Setup

1. goto https://clerk.com/
2. sign in and create app, and follow Get started guide.
3. `npm install @clerk/nextjs`
4. Set your environment variables to your .env
5. Add ClerkProvider to your app <br/>
   app/(platform)/layout.tsx

   ```tsx
   import { ClerkProvider } from "@clerk/nextjs";

   const PlatformLayout = ({ children }: { children: React.ReactNode }) => {
     return <ClerkProvider>{children}</ClerkProvider>;
   };

   export default PlatformLayout;
   ```

6. Update middleware.ts<br/>
   middleware.ts

   ```ts
   import { authMiddleware } from "@clerk/nextjs";

   export default authMiddleware({});

   export const config = {
     matcher: ["/((?!.+.[w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
   };
   ```

   <!-- 7. goto https://clerk.com/docs/references/nextjs/custom-signup-signin-pages -->

#### Add custom sign up and sign in pages

1. goto https://clerk.com/docs/references/nextjs/custom-signup-signin-pages
2. Build your sign-up page
   app/sign-up/[[...sign-up]]/page.tsx

   ```tsx
   import { SignUp } from "@clerk/nextjs";

   export default function Page() {
     return <SignUp />;
   }
   ```

3. Build your sign-in page
   app/sign-in/[[...sign-in]]/page.tsx

   ```tsx
   import { SignIn } from "@clerk/nextjs";

   export default function Page() {
     return <SignIn />;
   }
   ```

4. Update your environment variables
   .env

   ```txt
   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
   NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
   NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
   NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
   ```

#### 設定公開路徑

我們想讓 "/" 路徑可以被未登入的人訪問，我們可以在 middleware 中的 authMiddleware 函數傳入`{publicRoutes: ["/"]}`，公開 "/" 路徑<br/>
middleware.ts

```ts
export default authMiddleware({ publicRoutes: ["/"] });
```

#### Organizations

1. goto https://dashboard.clerk.com
2. click Organizations
3. click Enable organizations
4. Switch on Enable organizations
5. see doc: `https://clerk.com/docs/components/organization/organization-list#usage-with-frameworks`
6. build OrganizationList page, see code: `app/(platform)/(clerk)/select-org/[[...select-org]]/page.tsx` or `app/(platform)/(dashboard)/_components/navbar.tsx`

## tanstack/react-query

### QueryClientProvider 是 client component 所以被包裹在 QueryClientProvider 下的所有組件都會變成 client component 嗎？答案是不會，詳細原因如下

如果我們是用 children 的方式把 server component 傳入到 client component 做為參數， next.js 不會把這個 server component 轉成 client component

參考實際的代碼，我們雖然在 `app/(platform)/layout.tsx`

```tsx
import { Toaster } from "sonner";
import { ClerkProvider } from "@clerk/nextjs";

import { ModalProvider } from "@/components/providers/modal-provider";
import { QueryProvider } from "@/components/providers/query-provider";

const PlatformLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <ClerkProvider>
      <QueryProvider>
        <Toaster />
        <ModalProvider />
        {children}
      </QueryProvider>
    </ClerkProvider>
  );
};

export default PlatformLayout;
```

用 QueryProvider 這個 client component 把所有組件包裹起來，但是我們並不會把 QueryProvider 下的組件都變成 client component ，因為我們用 children 傳進 QueryProvider ，可以看 `components/providers/query-provider.tsx`

```tsx
"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export const QueryProvider = ({ children }: { children: React.ReactNode }) => {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};
```

如果是用 children 傳進 client component 的話， children 裡面是 server component 還是會維持是 server component 不會被 next.js 轉成 client component ，不用擔心

#### 定義 afterAuth 的動作

1. afterAuth(): https://clerk.com/docs/references/nextjs/auth-middleware#use-after-auth-for-fine-grained-control
2. redirectToSignIn(): https://clerk.com/docs/references/javascript/clerk/redirect-methods#redirect-to-sign-in

## Backend

### Database

#### Set up

1. `npm i -D prisma` 安裝 prisma
2. `npx prisma init` 初始化 prisma

   ```txt
   tvbs@ST8F-60057MAC trello-tutorial % npx prisma init

   ✔ Your Prisma schema was created at prisma/schema.prisma
     You can now open it in your favorite editor.

   warn You already have a .gitignore file. Don't forget to add `.env` in it to not commit any private information.

   Next steps:
   1. Set the DATABASE_URL in the .env file to point to your existing database. If your database has no tables yet, read https://pris.ly/d/getting-started
   2. Set the provider of the datasource block in schema.prisma to match your database: postgresql, mysql, sqlite, sqlserver, mongodb or cockroachdb.
   3. Run prisma db pull to turn your database schema into a Prisma schema.
   4. Run prisma generate to generate the Prisma Client. You can then start querying your database.

   More information in our documentation:
   https://pris.ly/d/getting-started
   ```

~~3. goto planetscale create database, 注意：現在 planetscale 不是免費的，用完記得刪掉~~
~~4. prisma/schema.prisma~~

~~```prisma~~
~~datasource db {~~
~~provider = "mysql"~~
~~url = env("DATABASE_URL")~~
~~relationMode = "prisma"~~
~~}~~

~~generator client {~~
~~provider = "prisma-client-js"~~
~~}
~~```~~

3. 因為 planetscale 開始收費所以改用 neon ， goto https://neon.tech/ ，申請帳號，創建 db
4. schema.prisma

   ```prisma
   datasource db {
     provider  = "postgresql"
     url  	    = env("DATABASE_URL")
     relationMode = "prisma"
   }

   // 指定客戶端的類型和語言： 通過在 generator client 配置中指定 provider，例如 prisma-client-js，你告訴 Prisma 生成 JavaScript/TypeScript 客戶端。這對於使用 Node.js 或任何支持 JavaScript 的環境是必需的。
   generator client {
     provider = "prisma-client-js"
   }
   ```

5. `npx prisma generate` 在 local create types and functions schema.prisma , see: https://www.prisma.io/docs/orm/reference/prisma-cli-reference#generate

   ```txt
   Environment variables loaded from .env
   Prisma schema loaded from prisma/schema.prisma

   ✔ Generated Prisma Client (v5.13.0) to ./node_modules/@prisma/client in 35ms

   Start using Prisma Client in Node.js (See: https://pris.ly/d/client)
   import { PrismaClient } from '@prisma/client'
   const prisma = new PrismaClient()
   ```

6. `npx prisma db push` sync Prisma schema to remote database (neon)

   ```txt
   Environment variables loaded from .env
   Prisma schema loaded from prisma/schema.prisma
   Datasource "db": PostgreSQL database "neondb", schema "public" at "ep-orange-grass-a4rtsubj-pooler.us-east-1.aws.neon.tech"

   🚀  Your database is now in sync with your Prisma schema. Done in 10.70s
   ```

7. `npm i @prisma/client` 安裝 @prisma/client
8. 記得之後只要更動有關於 prisma 的東西後都需要 run `npx prisma generate` 生成新的 types and functions ，然後 run `npx prisma db push` sync 到遠端資料庫
9. Prevent hot reloading from creating new instances of PrismaClient, see lib/db.ts and https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/databases-connections#prevent-hot-reloading-from-creating-new-instances-of-prismaclient
10. `npx prisma studio` ，開啟 prisma studio ，他是一個把我們 database 的視覺化的工具

#### prisma

1. how to reset entire database `npx prisma migrate reset` ，注意！他會清空你所有資料
2. sync local schema remote database `npx prisma db push`
3. generate types locally `npx prisma generate`

## unsplash spi

1. goto https://unsplash.com/developers
2. Register as a developer
3. click Your apps
4. create new apps (記得要收帳號驗證信才能創建 app)
5. 創建新的 app 就可以拿到 api key
6. unsplash-js 開發者文件 https://github.com/unsplash/unsplash-js
7. `npm i unsplash-js`
8. see lib/unsplash.ts and .env file

## frontend

### dnd - board

https://dnd.hellopangea.com/?path=/story/examples-board--simple

# Troubleshooting

1.  在 `prisma/schema.prisma` model List 中的 updatedAt 誤寫成 updateAt 造成在 `app/(platform)/(dashboard)/board/[boardId]/_components/list-container.tsx` 調用 executeUpdateListOrder 發生下面的錯誤：

    ```txt
    Type '
    {
     order: number; id:
     string; title: string;
     boardId: string;
     createdAt: Date;
     updateAt: Date;
     cards: {
       id: string;
       title: string; order:
       number;
       createdAt: Date;
       updateAt: Date;
       description: string | null;
       listId: string; }[];
     }[]'
    is not assignable to type '
    {
       id: string; title:
       string; order: number;
       createdAt: Date;
       updatedAt: Date;
     }[]'.

       Property 'updatedAt' is missing in type '
       {
         order: number;
         id: string;
         title: string;
         createdAt: Date;
         boardId: string;
         updateAt: Date;
         cards: Card[];
       }' but required in type '
       {
         id: string;
         title: string;
         order: number;
         createdAt: Date;
         updatedAt: Date;
       }'.

       (property) items: {
         id: string;
         title: string;
         order: number;
         createdAt: Date;
         updatedAt: Date;
       }[]
    ```

    executeUpdateListOrder 接收的是

    ```ts
    const items: {
      id: string;
      title: string;
      order: number;
      createdAt: Date;
      updatedAt: Date;
    }[];
    ```

    但是我們傳進去的是

    ```ts
    const items: {
      order: number;
      id: string;
      title: string;
      createdAt: Date;
      boardId: string;
      updateAt: Date;
      cards: Card[];
    }[];
    ```

    原因是我們在 `prisma/schema.prisma` model List 中就把 key 把 updatedAt 拼錯成 updateAt 所以 prisma 生成的 db 欄位名稱和 ts 類型都是錯的

    ```prisma
    model List {
      id    String @id @default(uuid())
      title String
      order Int

      boardId String
      board   Board  @relation(fields: [boardId], references: [id], onDelete: Cascade)

      cards Card[]

      createdAt DateTime @default(now())
      updateAt  DateTime @updatedAt

      @@index([boardId])
    }
    ```

    為什麼後來能發現呢？

    因為我們在 `actions/update-list-order/schema.ts` 中寫的是 updatedAt 是拼對的

    ```ts
    import { z } from "zod";

    export const UpdateListOrder = z.object({
      items: z.array(
        z.object({
          id: z.string(),
          title: z.string(),
          order: z.number(),
          createdAt: z.date(),
          updatedAt: z.date(),
        })
      ),
      boardId: z.string(),
    });
    ```

    所以真正的錯誤是我們的 `schema.prisma` 的欄位名稱（key）`updateAt  DateTime @updatedAt` 和 `actions/update-list-order/schema.ts` 中定義的 key `updatedAt: z.date()` 不匹配造成的，只要把他們改成一致就可以了。

    我們可以把 `actions/update-list-order/schema.ts` 中定義的 key `updatedAt: z.date()` 改成 `updateAt: z.date()` ，但是既然發現拼錯了，我們就把它改成對的吧。

    我們把 `schema.prisma` 的 model List 改成 `updatedAt  DateTime @updatedAt` 然後在 run prisma 的指令，產生 ts 類型`npx prisma generate` ，推到 db `npx prisma db push` ，注意這個指令會 reset 你的 db 。

# 紀錄 useAction 的流程

useAction 傳入第一個參數決定用哪個 action，並把回傳值解構出 execute 並重命名為 executeDelete，

```tsx
// list-options.tsx
const { execute: executeDelete } = useAction(deleteList, {
  onSuccess: (data) => {
    toast.success(`List "${data.title}" deleted`);
    closeRef.current?.click();
  },
  onError: (error) => {
    toast.error(error);
  },
});
```

把需要的資料傳入 executeDelete 並調用

```tsx
// list-options.tsx
executeDelete({ id, boardId });
```

executeDelete 就是 hooks/use-action.ts 裡的 useAction 返回的 execute ，前面我們執行了 `executeDelete({ id, boardId });` ，所以 execute 的 input 是 { id, boardId }， action 是 deleteList ，這裡的 `action(input)` 也就是 `deleteList({ id, boardId })`

```tsx
// use-action.ts
export const useAction = <TInput, TOutput>(
  action: Action<TInput, TOutput>,
  options: UseActionOptions<TOutput> = {}
) => {
  const execute = useCallback(
    async (input: TInput) => {
      setIsLoading(true);
      try {
        const result = await action(input);

        if (!result) {
          return;
        }

        setFieldErrors(result.fieldErrors);

        if (result.error) {
          setError(result.error);
          options.onError?.(result.error);
        }

        if (result.data) {
          setData(result.data);
          options.onSuccess?.(result.data);
        }
      } finally {
        setIsLoading(false);
        options.onComplete?.();
      }
    },
    [action, options]
  );
  return {
    execute,
  };
};
```

`deleteList({ id, boardId })` 在 actions/delete-list/index.ts 是

```tsx
const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId, orgId } = auth();

  if (!userId || !orgId) {
    return {
      error: "Unauthorized",
    };
  }

  const { id, boardId } = data;
  let list;

  try {
    list = await db.list.delete({
      where: {
        id,
        boardId,
        board: {
          orgId,
        },
      },
    });

    await createAuditLog({
      entityTitle: list.title,
      entityId: list.id,
      entityType: ENTITY_TYPE.LIST,
      action: ACTION.DELETE,
    });
  } catch (error) {
    return { error: "Failed to delete." };
  }

  revalidatePath(`/board/${boardId}}`);
  return { data: list };
};

export const deleteList = createSafeAction(DeleteList, handler);
```

DeleteList 是什么？<br/>
它是一个 Zod 对象（类型是 ZodObject）。<br/>
z.object() 创建了一个模式对象（schema），用于验证输入数据是否符合定义的规则。<br/>
actions/delete-list/schema.ts

```tsx
import { z } from "zod";

export const DeleteList = z.object({
  id: z.string(),
  boardId: z.string(),
});
```

zod 的使用範例

```tsx
import { z } from "zod";

export const DeleteList = z.object({
  id: z.string(),
  boardId: z.string(),
});

const result = DeleteList.safeParse({ id: "123", boardId: "456" });
if (result.success) {
  console.log(result.data); // 验证通过的数据
} else {
  console.error(result.error); // 验证失败的错误信息
}
```

為什麼 `deleteList` 可以接收參數，像是`deleteList({ id, boardId })`，是因為 `deleteList = createSafeAction(DeleteList, handler);` 而 createSafeAction 的代碼是

```tsx
const createSafeAction = <TInput, TOutput>(
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
```

`createSafeAction` 返回一個`(data: TInput)=>{}`函數，這個函數需要傳入一個參數，所以假設我調用了

```tsx
deleteList({
  id: "294b731b-2e3d-4b1a-91c8-463b56b482d6",
  boardId: "f70f12da-a310-42be-949e-4bbef5088bd3",
});
```

這個對象會

```tsx
{
  id: "294b731b-2e3d-4b1a-91c8-463b56b482d6",
  boardId: "f70f12da-a310-42be-949e-4bbef5088bd3",
}
```

傳入到 `createSafeAction` 返回的函數

```tsx
(data: TInput): Promise<ActionState<TInput, TOutput>> => {
  const validationResult = schema.safeParse(data);
  if (!validationResult.success) {
    return {
      fieldErrors: validationResult.error.flatten()
        .fieldErrors as FieldErrors<TInput>,
    };
  }

  return handler(validationResult.data);
};
```

像是

```tsx
const validationResult = schema.safeParse({
  id: "294b731b-2e3d-4b1a-91c8-463b56b482d6",
  boardId: "f70f12da-a310-42be-949e-4bbef5088bd3",
});
if (!validationResult.success) {
  return {
    fieldErrors: validationResult.error.flatten()
      .fieldErrors as FieldErrors<TInput>,
  };
}

return handler(validationResult.data);
```

# 工厂函数 的概念，以及 createSafeAction 是怎么用到这个概念的。

1.  什么是工厂函数？

    一个工厂函数就是一个“生成其他东西的函数”，比如生成对象、函数或其他内容。

    举个简单的例子：造人

    ```js
    function createPerson(name, age) {
      return {
        name: name,
        age: age,
        sayHello() {
          return `Hi, my name is ${this.name} and I am ${this.age} years old.`;
        },
      };
    }

    const person1 = createPerson("Alice", 25);
    const person2 = createPerson("Bob", 30);

    console.log(person1.sayHello()); // 输出: Hi, my name is Alice and I am 25 years old.
    console.log(person2.sayHello()); // 输出: Hi, my name is Bob and I am 30 years old.
    ```

    工厂函数的特点：

    它生成了“人”这个对象。

    你只需要告诉它名字和年龄，它就会按照规则生成一个对象。

    每次生成的对象都可以有不同的属性，但逻辑是通用的。

2.  一个更接近的例子：生成函数

    现在我们让工厂生成函数，而不是对象。

    例子：创建带欢迎信息的函数

    ```js
    function createGreeter(greeting) {
      return function (name) {
        return `${greeting}, ${name}!`;
      };
    }

    const sayHello = createGreeter("Hello");
    const sayHi = createGreeter("Hi");

    console.log(sayHello("Alice")); // 输出: Hello, Alice!
    console.log(sayHi("Bob")); // 输出: Hi, Bob!
    ```

    这里的工厂函数特点：

    createGreeter 是工厂函数，它生成了不同的函数。

    你告诉它“欢迎词”（greeting），它就给你一个带有这个欢迎词的函数。

    每个生成的函数都可以处理不同的名字。

3.  試著寫一個簡化版的 createSafeAction

    你的 createSafeAction 本质上是一个工厂函数：

    它接受验证规则（schema）和逻辑处理器（handler）。

    它生成了一个“安全的函数”，这个函数可以验证数据并执行逻辑。

    用简单的例子改写 createSafeAction

    假设我们想要生成一个“验证并处理”的函数：

    ```js
    function createSafeAction(schema, handler) {
      return function (data) {
        // 第一步：验证数据
        const isValid = schema(data);
        if (!isValid) {
          return { error: "Validation failed" };
        }

        // 第二步：调用处理逻辑
        return handler(data);
      };
    }
    ```

    使用示例：

    1. 定义一个简单的验证规则（schema）：

       ```js
       function isNonEmptyString(data) {
         return typeof data === "string" && data.length > 0;
       }
       ```

    2. 定义一个处理器（handler）：

       ```js
       function handleData(data) {
         return `Data "${data}" processed successfully.`;
       }
       ```

    3. 使用工厂生成一个安全的函数：

       ```js
       const safeAction = createSafeAction(isNonEmptyString, handleData);
       ```

    4. 调用生成的函数：
       ```js
       console.log(safeAction("Hello")); // 输出: Data "Hello" processed successfully.
       console.log(safeAction("")); // 输出: { error: "Validation failed" }
       console.log(safeAction(123)); // 输出: { error: "Validation failed" }
       ```

# Stripe

## 測試用信用卡

https://docs.stripe.com/testing

# Deploy

## add package.json scripts
在 package.json 的 scripts 增加 `"postinstall": "prisma generate"`

```json
"scripts": {
    "postinstall": "prisma generate"
  }
```
