import { NextRequest, NextResponse } from 'next/server';
import { Buffer } from 'buffer';

export const runtime = 'nodejs';

const NOTION_OAUTH_URL = 'https://api.notion.com/v1/oauth/authorize';
const NOTION_TOKEN_URL = 'https://api.notion.com/v1/oauth/token';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const state = searchParams.get('state') ?? searchParams.get('from') ?? '/';

  if (error) {
    const errorUrl = new URL(state, process.env.NEXT_PUBLIC_APP_URL);
    errorUrl.searchParams.set('error', 'notion_failed');
    return NextResponse.redirect(errorUrl);
  }

  if (!code && !error) {
    const params = new URLSearchParams({
      client_id: process.env.NEXT_PUBLIC_NOTION_CLIENT_ID ?? '',
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/notion`,
      response_type: 'code',
      owner: 'user',
      state, // preserve original page
    });

    return NextResponse.redirect(`${NOTION_OAUTH_URL}?${params.toString()}`);
  }

  try {
    const tokenResponse = await fetch(NOTION_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(
          `${process.env.NEXT_PUBLIC_NOTION_CLIENT_ID}:${process.env.NEXT_PUBLIC_NOTION_CLIENT_SECRET}`
        ).toString('base64')}`,
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/notion`,
      }),
    });

    const tokens = await tokenResponse.json();

    const fragmentParams = new URLSearchParams({
      provider: 'notion',
      access_token: String(tokens.access_token ?? ''),
    });

    const redirectUrl = new URL(state, process.env.NEXT_PUBLIC_APP_URL);
    redirectUrl.searchParams.set('success', 'notion');
    redirectUrl.hash = fragmentParams.toString();

    return NextResponse.redirect(redirectUrl);
  } catch {
    const errorUrl = new URL(state, process.env.NEXT_PUBLIC_APP_URL);
    errorUrl.searchParams.set('error', 'notion_failed');
    return NextResponse.redirect(errorUrl);
  }
}
