import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const ATLASSIAN_AUTH_URL = 'https://auth.atlassian.com/authorize';
const ATLASSIAN_TOKEN_URL = 'https://auth.atlassian.com/oauth/token';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const state = searchParams.get('state') ?? searchParams.get('from') ?? '/';

  if (error) {
    const errorUrl = new URL(state, process.env.NEXT_PUBLIC_APP_URL);
    errorUrl.searchParams.set('error', 'atlassian_failed');
    return NextResponse.redirect(errorUrl);
  }

  if (!code && !error) {
    const params = new URLSearchParams({
      audience: 'api.atlassian.com',
      client_id: process.env.ATLASSIAN_CLIENT_ID ?? '',
      scope:
        'read:jira-work read:jira-user manage:jira-project write:jira-work write:confluence-content read:confluence-content.all read:confluence-space.summary read:confluence-user read:confluence-props read:confluence-content.summary search:confluence read:page:confluence read:space:confluence offline_access',
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/atlassian`,
      response_type: 'code',
      prompt: 'consent',
      state,
    });

    return NextResponse.redirect(`${ATLASSIAN_AUTH_URL}?${params.toString()}`);
  }

  try {
    const tokenResponse = await fetch(ATLASSIAN_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        client_id: process.env.ATLASSIAN_CLIENT_ID,
        client_secret: process.env.ATLASSIAN_CLIENT_SECRET,
        code,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/atlassian`,
      }),
    });

    const tokens = await tokenResponse.json();

    const resourcesRes = await fetch(
      'https://api.atlassian.com/oauth/token/accessible-resources',
      {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
          Accept: 'application/json',
        },
      }
    );
    const resources = await resourcesRes.json();

    const fragmentParams = new URLSearchParams({
      provider: 'atlassian',
      refresh_token: String(tokens.refresh_token ?? ''),
      cloud_id: String(resources[0].id ?? ''),
      base_url: String(resources[0].url ?? ''),
    });

    const redirectUrl = new URL(state, process.env.NEXT_PUBLIC_APP_URL);
    redirectUrl.searchParams.set('success', 'atlassian');
    redirectUrl.hash = fragmentParams.toString();
    return NextResponse.redirect(redirectUrl);
  } catch {
    const errorUrl = new URL(state, process.env.NEXT_PUBLIC_APP_URL);
    errorUrl.searchParams.set('error', 'atlassian_failed');
    return NextResponse.redirect(errorUrl);
  }
}
