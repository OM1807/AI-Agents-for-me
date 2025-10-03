import { NextRequest, NextResponse } from 'next/server';
import {
  generatePKCE,
  generateState,
  storeSecureData,
  getSecureData,
  deleteSecureData,
} from './crypto';

export const runtime = 'nodejs';

// MCP OAuth endpoints
const MCP_REGISTER_URL =
  'https://atlassian-remote-mcp-production.atlassian-remote-mcp-server-production.workers.dev/v1/register';
const MCP_AUTH_URL = 'https://mcp.atlassian.com/v1/authorize';
const MCP_TOKEN_URL =
  'https://atlassian-remote-mcp-production.atlassian-remote-mcp-server-production.workers.dev/v1/token';

// Scope configuration
const MCP_SCOPES =
  'read:jira-work read:jira-user manage:jira-project write:jira-work write:confluence-content read:confluence-content.all read:confluence-space.summary read:confluence-user read:confluence-props read:confluence-content.summary search:confluence read:page:confluence read:space:confluence offline_access';

interface MCPClientCredentials {
  client_id: string;
  client_secret: string;
  registration_access_token: string;
  registration_client_uri: string;
}

/**
 * Register a new OAuth client dynamically
 */
async function registerClient(): Promise<MCPClientCredentials> {
  const response = await fetch(MCP_REGISTER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_name: 'SDLC Agents',
      redirect_uris: [
        `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/atlassian-mcp`,
      ],
      grant_types: ['authorization_code', 'refresh_token'],
      response_types: ['code'],
      scope: MCP_SCOPES,
      token_endpoint_auth_method: 'client_secret_post',
      application_type: 'web',
      //   client_uri: process.env.NEXT_PUBLIC_APP_URL,
    }),
  });

  if (!response.ok) {
    throw new Error(`Client registration failed: ${response.status}`);
  }

  const credentials = await response.json();
  return credentials;
}

/**
 * Get or create client credentials
 */
async function getClientCredentials(): Promise<MCPClientCredentials> {
  // In production, store these in a secure database
  let credentials = getSecureData('mcp_client_credentials');

  if (!credentials) {
    credentials = await registerClient();
    // Store for 30 days
    storeSecureData(
      'mcp_client_credentials',
      credentials,
      30 * 24 * 60 * 60 * 1000
    );
  }

  return credentials;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const state = searchParams.get('state');
  const originalPath = searchParams.get('from') ?? '/';

  if (error) {
    const errorUrl = new URL(originalPath, process.env.NEXT_PUBLIC_APP_URL);
    errorUrl.searchParams.set('error', 'atlassian_mcp_failed');
    errorUrl.searchParams.set('error_description', error);
    return NextResponse.redirect(errorUrl);
  }

  // Step 1: Initialize OAuth flow
  if (!code && !error) {
    try {
      // Get or create client credentials
      const credentials = await getClientCredentials();

      // Generate PKCE and state
      const pkce = generatePKCE();
      const stateParam = generateState();

      // Store PKCE verifier and original path for callback
      storeSecureData(`pkce_${stateParam}`, {
        verifier: pkce.code_verifier,
        originalPath,
        clientId: credentials.client_id,
        clientSecret: credentials.client_secret,
      });

      // Build authorization URL
      const params = new URLSearchParams({
        client_id: credentials.client_id,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/atlassian-mcp`,
        response_type: 'code',
        scope: MCP_SCOPES,
        state: stateParam,
        code_challenge: pkce.code_challenge,
        code_challenge_method: pkce.code_challenge_method,
      });

      return NextResponse.redirect(`${MCP_AUTH_URL}?${params.toString()}`);
    } catch (error) {
      console.error('Failed to initialize MCP OAuth:', error);
      const errorUrl = new URL(originalPath, process.env.NEXT_PUBLIC_APP_URL);
      errorUrl.searchParams.set('error', 'atlassian_mcp_init_failed');
      return NextResponse.redirect(errorUrl);
    }
  }

  // Step 2: Handle OAuth callback
  if (code && state) {
    try {
      // Retrieve stored PKCE data
      const storedData = getSecureData(`pkce_${state}`);
      if (!storedData) {
        throw new Error('Invalid or expired state parameter');
      }

      const {
        verifier,
        originalPath: storedPath,
        clientId,
        clientSecret,
      } = storedData;

      // Exchange code for tokens
      const tokenResponse = await fetch(MCP_TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: clientId,
          client_secret: clientSecret,
          code,
          redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/atlassian-mcp`,
          code_verifier: verifier,
        }),
      });

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json();
        throw new Error(
          `Token exchange failed: ${errorData.error || tokenResponse.status}`
        );
      }

      const tokens = await tokenResponse.json();

      // Clean up stored data
      deleteSecureData(`pkce_${state}`);

      // Return client credentials and tokens via URL fragment
      const fragmentParams = new URLSearchParams({
        provider: 'atlassian-mcp',
        refresh_token: String(tokens.refresh_token ?? ''),
        access_token: String(tokens.access_token ?? ''),
        client_id: clientId,
        client_secret: clientSecret,
        expires_in: String(tokens.expires_in ?? '3600'),
      });

      const redirectUrl = new URL(storedPath, process.env.NEXT_PUBLIC_APP_URL);
      redirectUrl.searchParams.set('success', 'atlassian_mcp');
      redirectUrl.hash = fragmentParams.toString();

      return NextResponse.redirect(redirectUrl);
    } catch (error) {
      console.error('MCP OAuth callback error:', error);
      const errorUrl = new URL(originalPath, process.env.NEXT_PUBLIC_APP_URL);
      errorUrl.searchParams.set('error', 'atlassian_mcp_callback_failed');
      return NextResponse.redirect(errorUrl);
    }
  }

  // Invalid request
  const errorUrl = new URL(originalPath, process.env.NEXT_PUBLIC_APP_URL);
  errorUrl.searchParams.set('error', 'atlassian_mcp_invalid_request');
  return NextResponse.redirect(errorUrl);
}
