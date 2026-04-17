import { NextRequest, NextResponse } from "next/server";

/**
 * LINE OAuth callback handler
 * LINE is configured to redirect to /auth/line/callback
 * This route handles the callback and processes the LINE login
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// Ensure this route is treated as dynamic
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Handle OPTIONS for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");
    let tableNumberFromState: string | null = null;

    if (state && state.includes("|table:")) {
      const parts = state.split("|table:");
      if (parts.length > 1 && parts[1]) {
        tableNumberFromState = decodeURIComponent(parts[1]);
      }
    }

    if (error) {
      const errorDescription = searchParams.get("error_description");
      return NextResponse.redirect(
        new URL(
          `/login?error=${encodeURIComponent(errorDescription || error)}`,
          request.url
        )
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL("/login?error=missing_authorization_code", request.url)
      );
    }

    // Build query string for backend
    const backendParams = new URLSearchParams();
    backendParams.set("code", code);
    if (state) {
      backendParams.set("state", state);
    }
    if (tableNumberFromState) {
      backendParams.set("tableNumber", tableNumberFromState);
    }

    // Call backend callback endpoint
    const backendResponse = await fetch(
      `${API_BASE_URL}/api/auth/line/callback?${backendParams.toString()}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json().catch(() => ({}));
      return NextResponse.redirect(
        new URL(
          `/login?error=${encodeURIComponent(errorData.error || "LINE login failed")}`,
          request.url
        )
      );
    }

    const data = await backendResponse.json();
    const { token, user } = data;

    if (!token || !user) {
      return NextResponse.redirect(
        new URL("/login?error=invalid_response", request.url)
      );
    }

    // Redirect to frontend callback page with token
    const redirectUrl = new URL("/login/callback", request.url);
    redirectUrl.searchParams.set("token", token);
    redirectUrl.searchParams.set("user", JSON.stringify(user));

    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error("LINE callback error:", error);
    return NextResponse.redirect(
      new URL(
        `/login?error=${encodeURIComponent("An unexpected error occurred")}`,
        request.url
      )
    );
  }
}

