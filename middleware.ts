import { NextResponse } from "next/server";
import { authMiddleware, redirectToSignIn } from "@clerk/nextjs";

export default authMiddleware({
  publicRoutes: ["/", "/api/webhook"],

  // Some developers will need to handle specific cases such as handling redirects differently or detecting if a user is inside an organization. These cases can be handled with afterAuth().
  afterAuth(auth, req) {
    // auth.userId 存在表示 user 已被認證
    // auth.isPublicRoute 為 true 表示 user 要 access 的是 publicRoutes
    if (auth.userId && auth.isPublicRoute) {
      let path = `/select-org`;

      if (auth.orgId) {
        path = `/organization/${auth.orgId}`;
      }

      // URL() constructor: https://developer.mozilla.org/en-US/docs/Web/API/URL/URL
      const orgSelection = new URL(path, req.url);
      return NextResponse.redirect(orgSelection);
    }

    // 如果 user 沒有 logged in 但是想訪問 private route ，
    if (!auth.userId && !auth.isPublicRoute) {
      // redirectToSignIn(): Redirects to the sign-in URL, as configured in your application's instance settings.
      // redirectUrl: Full URL or path to navigate after successful sign-in, or sign-up. The same as setting afterSignInUrl and afterSignUpUrl to the same value.
      // 重定向到 sign-in URL ，如果成功 sign-in 則導向 returnBackUrl
      return redirectToSignIn({ returnBackUrl: req.url });
    }

    if (auth.userId && !auth.orgId && req.nextUrl.pathname !== "/select-org") {
      const orgSelection = new URL("/select-org", req.url);
      return NextResponse.redirect(orgSelection);
    }
  },
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
