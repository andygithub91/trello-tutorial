import Stripe from "stripe";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";

// 用于处理 Stripe 发出的事件通知的 Webhook
export async function POST(req: Request) {
  // req.text() 将请求的主体（body）读取为文本格式。这是因为 Stripe 发送的 Webhook 通知是以原始文本格式传递的。
  const body = await req.text();
  // 通过请求头 Stripe-Signature，获取 Stripe 签名。这个签名是 Stripe 用来验证 Webhook 请求合法性的重要字段。
  const signature = headers().get("Stripe-Signature") as string;

  // event 是 Stripe 的事件对象，将包含解析后的 Webhook 事件数据。
  let event: Stripe.Event;

  try {
    // stripe.webhooks.constructEvent 是 Stripe 提供的一个方法，用于验证 Webhook 请求的真实性，同时解析事件内容。
    // 它代表一个 Stripe Webhook 事件，包含有关事件的所有详细信息，包括类型、发生时间以及相关的数据。
    event = stripe.webhooks.constructEvent(
      // body 是请求体。
      body,
      // signature 是 Stripe 签名，用于验证事件是否伪造。
      signature,
      // process.env.STRIPE_WEBHOOK_SECRET 是你在 Stripe 中配置的 Webhook 签名密钥，用于验证签名。
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error) {
    return new NextResponse("Webhook error", { status: 400 });
  }

  /*
event 是 Stripe 的事件对象，通过 stripe.webhooks.constructEvent 创建。
它代表一个 Stripe Webhook 事件，包含有关事件的所有详细信息，包括类型、发生时间以及相关的数据。
  常见事件类型包括：
    checkout.session.completed：一个结算会话完成。
    payment_intent.succeeded：支付意图成功。
    其他类型...

event.data
  event.data 是 Stripe 事件对象中的一个属性，用来存储与该事件相关的附加数据。
  它包含一个名为 object 的字段。

event.data.object
  event.data.object 是事件中的核心对象，它包含实际的业务数据。
  根据事件类型，这个对象可能是不同的类型。例如：
    如果是 checkout.session.completed 事件，object 会是 Stripe.Checkout.Session 类型。
    如果是 payment_intent.succeeded 事件，object 会是 Stripe.PaymentIntent 类型。

as Stripe.Checkout.Session
  这是 TypeScript 的类型断言，告诉编译器“我知道 event.data.object 是一个 Stripe.Checkout.Session 类型”。
  Stripe.Checkout.Session 是 Stripe 的 SDK 定义的类型，用来描述结算会话的结构和字段。
  这样，session 就被明确声明为 Stripe.Checkout.Session 类型，可以使用会话的特定属性，例如：
    session.id（会话 ID）。
    session.customer（关联的客户 ID）。
    session.payment_status（支付状态）。
*/
  const session = event.data.object as Stripe.Checkout.Session;

  if (event.type === "checkout.session.completed") {
    // stripe.subscriptions.retrieve() 是 Stripe 提供的一個函式，用來查詢訂閱資訊。例如，你有一個訂閱 ID，你可以用這個函式來取得該訂閱的狀態、用戶資訊等。
    const subscription = await stripe.subscriptions.retrieve(
      // session.subscription 是一個變數，裡面存放著訂閱的 ID。這個 ID 是用來向 Stripe 確認「是哪一個訂閱」。
      session.subscription as string
    );

    // actions/stripe-redirect/index.ts
    // metadata: {
    //   orgId,
    // },
    // 我們在 actions/stripe-redirect/index.ts 的 stripe.checkout.sessions.create 创建一个新的支付会话時，有把 orgId 放在 metadata 傳給 stripe，所以我們可以在 stripe 打我們的 webhook 時取得當時傳給 stripe 的 orgId
    if (!session?.metadata?.orgId) {
      return new NextResponse("Org ID is required", { status: 400 });
    }

    await db.orgSubscription.create({
      data: {
        orgId: session.metadata.orgId,
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: subscription.customer as string,
        stripePriceId: subscription.items.data[0].price.id,
        // Date 類別需要的時間戳是「以毫秒為單位」的，而 Stripe 返回的是「以秒為單位」的時間戳。為了將秒轉換為毫秒，你需要把這個數值乘以 1000。
        stripeCurrentPeriodEnd: new Date(
          subscription.current_period_end * 1000
        ),
      },
    });
  }

  // 這是 renewed subscription 的事件（續訂的事件）
  if (event.type === "invoice.payment_succeeded") {
    const subscription = await stripe.subscriptions.retrieve(
      session.subscription as string
    );

    await db.orgSubscription.update({
      where: {
        stripeSubscriptionId: subscription.id,
      },
      data: {
        stripePriceId: subscription.items.data[0].price.id,
        stripeCurrentPeriodEnd: new Date(
          subscription.current_period_end * 1000
        ),
      },
    });
  }

  return new NextResponse(null, { status: 200 });
}
