import { useEffect } from 'react';
import { useOAuthStore } from '@/store/oauth';
import { integrationApi } from '@/lib/api/api';
import type { CreateIntegrationData } from '@/types';
import { useUser } from '@/hooks/useUser';
import { toast } from 'sonner';

export function useOAuthTokenHandler() {
  const { setNotionConnection, setAtlassianMCPConnection } = useOAuthStore();
  const { accessToken } = useUser();
  useEffect(() => {
    const handleOAuthCallback = async () => {
      const hash = window.location.hash.substring(1); // Remove '#' symbol
      if (!hash) return;
      const params = new URLSearchParams(hash);
      const provider = params.get('provider');
      if (!provider) return;
      let payload: CreateIntegrationData = {
        name: '',
        auth_type: '',
        type: '',
        is_active: false,
        credentials: {},
      };

      if (provider === 'notion') {
        const access_token = params.get('access_token');
        payload = {
          name: 'notion',
          auth_type: 'api_key',
          type: 'notion',
          is_active: true,
          credentials: {
            token: access_token ?? '',
          },
        };
      } else if (provider === 'atlassian') {
        const refresh_token = params.get('refresh_token');
        const cloud_id = params.get('cloud_id');
        const base_url = params.get('base_url');
        const client_id = process.env.NEXT_PUBLIC_ATLASSIAN_CLIENT_ID ?? '';
        const client_secret =
          process.env.NEXT_PUBLIC_ATLASSIAN_CLIENT_SECRET ?? '';
        payload = {
          name: 'atlassian',
          auth_type: 'oauth',
          type: 'atlassian',
          is_active: true,
          credentials: {
            client_id,
            client_secret,
            cloud_id: cloud_id ?? '',
            site_url: base_url ?? '',
            refresh_token: refresh_token ?? '',
          },
        };
      } else if (provider === 'atlassian-mcp') {
        const refresh_token = params.get('refresh_token');
        const client_id = params.get('client_id');
        const client_secret = params.get('client_secret');
        const expires_in = params.get('expires_in');
        const access_token = params.get('access_token');

        // Convert expires_in (seconds) to expiration timestamp
        const expiresInSeconds = parseInt(expires_in || '3600', 10);
        const expirationTimestamp = Date.now() + expiresInSeconds * 1000;

        payload = {
          name: 'atlassian',
          auth_type: 'oauth',
          type: 'atlassian',
          is_active: true,
          credentials: {
            client_id: client_id ?? '',
            client_secret: client_secret ?? '',
            refresh_token: refresh_token ?? '',
            access_token: access_token ?? '',
            expires_at: expirationTimestamp.toString(),
          },
        };
      }

      try {
        const response = await integrationApi.create(
          payload,
          accessToken ?? ''
        );
        if (response.success && response.data) {
          if (provider === 'notion') {
            setNotionConnection({
              isConnected: true,
              id: response.data.id,
            });
            toast.success('Notion connected successfully');
          }
          // else if (provider === 'atlassian') {
          //   setAtlassianConnection({
          //     isConnected: true,
          //     id: response.data.id,
          //   });
          //   toast.success('Confluence connected successfully');
          // }
          else if (provider === 'atlassian-mcp') {
            setAtlassianMCPConnection({
              isConnected: true,
              id: response.data.id,
            });
            toast.success('Atlassian MCP connected successfully');
          }
        }
      } catch {
        const providerName =
          provider === 'notion'
            ? 'Notion'
            : provider === 'atlassian-mcp'
              ? 'Atlassian MCP'
              : 'Confluence';
        toast.error(`Failed to connect ${providerName}. Please try again.`);
      }

      // Clean up fragment from URL
      window.history.replaceState(
        null,
        '',
        window.location.pathname + window.location.search
      );
    };

    handleOAuthCallback();
  }, [
    accessToken,
    setNotionConnection,
    // setAtlassianConnection,
    setAtlassianMCPConnection,
  ]);
}
