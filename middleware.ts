import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Protect /admin/* except /admin/login.
 * Session via Supabase Auth cookies; email must be in ADMIN_EMAILS.
 * Graceful when Supabase env is missing (redirect to login).
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  // Login is public
  if (pathname === "/admin/login" || pathname.startsWith("/admin/login/")) {
    return NextResponse.next();
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const buildLoginRedirect = (error?: string) => {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/admin/login";
    loginUrl.search = "";
    if (error) loginUrl.searchParams.set("error", error);
    const next = pathname + request.nextUrl.search;
    if (next && next !== "/admin/login") {
      loginUrl.searchParams.set("next", next);
    }
    return NextResponse.redirect(loginUrl);
  };

  if (!url || !anonKey) {
    return buildLoginRedirect("auth_not_configured");
  }

  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return buildLoginRedirect();
  }

  const allowlist = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (allowlist.length === 0) {
    return buildLoginRedirect("allowlist_empty");
  }

  if (!allowlist.includes(user.email.toLowerCase())) {
    // Sign out so disallowed sessions do not linger authenticated
    const denyResponse = buildLoginRedirect("not_allowed");
    const denyClient = createServerClient(url, anonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            denyResponse.cookies.set(name, value, options);
          });
        },
      },
    });
    await denyClient.auth.signOut();
    return denyResponse;
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
