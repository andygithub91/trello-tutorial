"use server";

import { auth, currentUser } from "@clerk/nextjs";
import { revalidatePath } from "next/cache";
import { ACTION, ENTITY_TYPE } from "@prisma/client";

import { db } from "@/lib/db";
import { createAuditLog } from "@/lib/create-audit-log";
import { createSafeAction } from "@/lib/create-safe-action";

import { StripeRedirect } from "./schema";
import { InputType, ReturnType } from "./types";
import { absoluteUrl } from "@/lib/utils";
import { stripe } from "@/lib/stripe";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId, orgId } = auth();
  const user = await currentUser();

  if (!userId || !orgId || !user) {
    return {
      error: "Unauthorized",
    };
  }

  const settingUrl = absoluteUrl(`/organization/${orgId}`);

  let url = "";

  try {
    const orgSubscription = await db.orgSubscription.findUnique({
      where: {
        orgId,
      },
    });

    // 这里的if语句用于判断当前的组织订阅信息orgSubscription是否存在，以及该订阅信息是否包含有效的stripeCustomerId。
    if (orgSubscription && orgSubscription.stripeCustomerId) {
      // stripe.billingPortal.sessions.create() 是一个异步函数，它向Stripe API请求，创建一个允许用户管理自己订阅的会话。
      const stripeSession = await stripe.billingPortal.sessions.create({
        customer: orgSubscription.stripeCustomerId,
        return_url: settingUrl,
      });

      // stripeSession.url 是Stripe返回给你的会话链接，通过这个链接，用户可以进入Stripe的Billing Portal界面来管理自己的订阅。
      url = stripeSession.url;

      //这一段代码的目的是，当用户尝试管理他们的组织订阅时，如果这个组织已经有Stripe中的客户ID (stripeCustomerId)，则为这个用户创建一个可以访问Stripe结算门户的会话链接。

      // 结算门户（Billing Portal）是一个Stripe提供的界面，用户可以在其中：
      // 查看他们的订阅信息
      // 更新支付方式
      // 取消或更改订阅

      // 如果上面的if条件不成立，即用户没有订阅信息，就会进入到这个else部分，表示为用户创建一个新的Stripe支付会话。
    } else {
      // stripe.checkout.sessions.create() 是一个异步方法，它用于创建一个新的支付会话，也就是一个用户可以进入以完成付款的页面。
      const stripeSession = await stripe.checkout.sessions.create({
        // 这个URL是用户成功完成支付后的返回地址。
        // 当用户支付成功后，会被重定向到settingUrl，即组织的设置页面。
        success_url: settingUrl,
        // 这个URL是用户取消支付时的返回地址。
        // 如果用户在支付过程中选择取消，会被重定向到这个页面（同样是组织的设置页面）。
        cancel_url: settingUrl,
        // 这里定义了支付方式，["card"]表示只接受信用卡或借记卡支付。
        payment_method_types: ["card"],
        // mode指定为 "subscription"，表示创建一个订阅会话。
        // Stripe有三种模式：payment（一次性支付）、setup（保存支付信息）、和 subscription（订阅）。这里使用了subscription，因为这是为了给用户订阅服务。
        mode: "subscription",
        // billing_address_collection设为 "auto" 表示自动收集用户的账单地址。
        // Stripe会根据需要自动询问用户的账单地址信息。
        billing_address_collection: "auto",
        // 这个字段指定了用户的电子邮箱地址。
        // 这里使用的是user.emailAddresses[0].emailAddress，表示获取当前用户的第一个电子邮箱，用于在Stripe会话中填入用户的联系方式。
        customer_email: user.emailAddresses[0].emailAddress,
        // line_items表示订单的商品项。
        line_items: [
          {
            // price_data：包含价格相关的数据。
            price_data: {
              // currency: "USD"：货币单位为美元。
              currency: "USD",
              // product_data：描述了订阅的产品信息。
              product_data: {
                // name: "Taskify Pro"：产品的名称是"Taskify Pro"。
                name: "Taskify Pro",
                // description: "Unlimited boards for your organization"：产品描述，表示“为你的组织提供无限的看板功能”。
                description: "Unlimited boards for your organization",
              },
              // unit_amount: 2000：单位金额为2000美分（即20美元）。这表示每月的订阅费用是20美元。
              unit_amount: 2000,
              // recurring: { interval: "month" }：表示这是一个每月周期的订阅。
              recurring: {
                interval: "month",
              },
            },
            // quantity: 1：表示订阅数量为1。
            quantity: 1,
          },
        ],
        // metadata是一些额外的信息，可以用来关联Stripe中的数据和你自己系统的数据。
        // 这里将orgId作为元数据保存，以便在后续处理时可以通过Stripe的信息找到对应的组织。
        metadata: {
          orgId,
        },
      });

      // stripeSession.url 是创建的支付会话的URL，用户可以通过这个链接完成支付。
      url = stripeSession.url || "";
    }
  } catch {
    return {
      error: "Somehting went wrong!",
    };
  }

  revalidatePath(`/organization/${orgId}`);
  return { data: url };
};

export const stripeRedirect = createSafeAction(StripeRedirect, handler);
