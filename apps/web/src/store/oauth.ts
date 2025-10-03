import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface OAuthState {
  notionConnection: {
    isConnected: boolean;
    id: number;
  };
  gitHubConnection: {
    isConnected: boolean;
    id: number;
  };
  atlassianMCPConnection: {
    isConnected: boolean;
    id: number;
  };
  figmaConnection: {
    isConnected: boolean;
    id: number;
  };
  pagerDutyConnection: {
    isConnected: boolean;
    id: number;
  };
  sentryConnection: {
    isConnected: boolean;
    id: number;
  };
  newRelicConnection: {
    isConnected: boolean;
    id: number;
  };
  dataDogConnection: {
    isConnected: boolean;
    id: number;
  };
  grafanaConnection: {
    isConnected: boolean;
    id: number;
  };
  cloudWatchConnection: {
    isConnected: boolean;
    id: number;
  };
  userFilesConnection: {
    isConnected: boolean;
    id: number;
  };
  setNotionConnection: (connection: {
    isConnected: boolean;
    id: number;
  }) => void;
  setGitHubConnection: (connection: {
    isConnected: boolean;
    id: number;
  }) => void;
  setAtlassianMCPConnection: (connection: {
    isConnected: boolean;
    id: number;
  }) => void;
  setFigmaConnection: (connection: {
    isConnected: boolean;
    id: number;
  }) => void;
  setPagerDutyConnection: (connection: {
    isConnected: boolean;
    id: number;
  }) => void;
  setSentryConnection: (connection: {
    isConnected: boolean;
    id: number;
  }) => void;
  setNewRelicConnection: (connection: {
    isConnected: boolean;
    id: number;
  }) => void;
  setDataDogConnection: (connection: {
    isConnected: boolean;
    id: number;
  }) => void;
  setGrafanaConnection: (connection: {
    isConnected: boolean;
    id: number;
  }) => void;
  setCloudWatchConnection: (connection: {
    isConnected: boolean;
    id: number;
  }) => void;
  setUserFilesConnection: (connection: {
    isConnected: boolean;
    id: number;
  }) => void;
  resetConnections: () => void;
  resetNotionConnection: () => void;
  resetGitHubConnection: () => void;
  resetAtlassianMCPConnection: () => void;
  resetFigmaConnection: () => void;
  resetPagerDutyConnection: () => void;
  resetSentryConnection: () => void;
  resetNewRelicConnection: () => void;
  resetDataDogConnection: () => void;
  resetGrafanaConnection: () => void;
  resetCloudWatchConnection: () => void;
  resetUserFilesConnection: () => void;
}

export const useOAuthStore = create<OAuthState>()(
  devtools(
    persist(
      set => ({
        notionConnection: {
          isConnected: false,
          id: 0,
        },
        gitHubConnection: {
          isConnected: false,
          id: 0,
        },
        atlassianMCPConnection: {
          isConnected: false,
          id: 0,
        },
        figmaConnection: {
          isConnected: false,
          id: 0,
        },
        pagerDutyConnection: {
          isConnected: false,
          id: 0,
        },
        sentryConnection: {
          isConnected: false,
          id: 0,
        },
        newRelicConnection: {
          isConnected: false,
          id: 0,
        },
        dataDogConnection: {
          isConnected: false,
          id: 0,
        },
        grafanaConnection: {
          isConnected: false,
          id: 0,
        },
        cloudWatchConnection: {
          isConnected: false,
          id: 0,
        },
        userFilesConnection: {
          isConnected: false,
          id: 0,
        },
        setGitHubConnection: (connection: {
          isConnected: boolean;
          id: number;
        }) => set(() => ({ gitHubConnection: connection })),
        setNotionConnection: (connection: {
          isConnected: boolean;
          id: number;
        }) => set(() => ({ notionConnection: connection })),
        setAtlassianMCPConnection: (connection: {
          isConnected: boolean;
          id: number;
        }) => set(() => ({ atlassianMCPConnection: connection })),
        setFigmaConnection: (connection: {
          isConnected: boolean;
          id: number;
        }) => set(() => ({ figmaConnection: connection })),
        setPagerDutyConnection: (connection: {
          isConnected: boolean;
          id: number;
        }) => set(() => ({ pagerDutyConnection: connection })),
        setSentryConnection: (connection: {
          isConnected: boolean;
          id: number;
        }) => set(() => ({ sentryConnection: connection })),
        setNewRelicConnection: (connection: {
          isConnected: boolean;
          id: number;
        }) => set(() => ({ newRelicConnection: connection })),
        setDataDogConnection: (connection: {
          isConnected: boolean;
          id: number;
        }) => set(() => ({ dataDogConnection: connection })),
        setGrafanaConnection: (connection: {
          isConnected: boolean;
          id: number;
        }) => set(() => ({ grafanaConnection: connection })),
        setCloudWatchConnection: (connection: {
          isConnected: boolean;
          id: number;
        }) => set(() => ({ cloudWatchConnection: connection })),
        setUserFilesConnection: (connection: {
          isConnected: boolean;
          id: number;
        }) => set(() => ({ userFilesConnection: connection })),
        resetNotionConnection: () =>
          set(() => ({
            notionConnection: {
              isConnected: false,
              id: 0,
            },
          })),
        resetGitHubConnection: () =>
          set(() => ({
            gitHubConnection: {
              isConnected: false,
              id: 0,
            },
          })),
        resetAtlassianMCPConnection: () =>
          set(() => ({
            atlassianMCPConnection: {
              isConnected: false,
              id: 0,
            },
          })),
        resetFigmaConnection: () =>
          set(() => ({
            figmaConnection: {
              isConnected: false,
              id: 0,
            },
          })),
        resetPagerDutyConnection: () =>
          set(() => ({
            pagerDutyConnection: {
              isConnected: false,
              id: 0,
            },
          })),
        resetSentryConnection: () =>
          set(() => ({
            sentryConnection: {
              isConnected: false,
              id: 0,
            },
          })),
        resetNewRelicConnection: () =>
          set(() => ({
            newRelicConnection: {
              isConnected: false,
              id: 0,
            },
          })),
        resetDataDogConnection: () =>
          set(() => ({
            dataDogConnection: {
              isConnected: false,
              id: 0,
            },
          })),
        resetGrafanaConnection: () =>
          set(() => ({
            grafanaConnection: {
              isConnected: false,
              id: 0,
            },
          })),
        resetCloudWatchConnection: () =>
          set(() => ({
            cloudWatchConnection: {
              isConnected: false,
              id: 0,
            },
          })),
        resetUserFilesConnection: () =>
          set(() => ({
            userFilesConnection: {
              isConnected: false,
              id: 0,
            },
          })),
        resetConnections: () =>
          set(() => ({
            notionConnection: {
              isConnected: false,
              id: 0,
            },
            gitHubConnection: {
              isConnected: false,
              id: 0,
            },
            atlassianMCPConnection: {
              isConnected: false,
              id: 0,
            },
            figmaConnection: {
              isConnected: false,
              id: 0,
            },
            pagerDutyConnection: {
              isConnected: false,
              id: 0,
            },
            sentryConnection: {
              isConnected: false,
              id: 0,
            },
            newRelicConnection: {
              isConnected: false,
              id: 0,
            },
            dataDogConnection: {
              isConnected: false,
              id: 0,
            },
            grafanaConnection: {
              isConnected: false,
              id: 0,
            },
            cloudWatchConnection: {
              isConnected: false,
              id: 0,
            },
            userFilesConnection: {
              isConnected: false,
              id: 0,
            },
          })),
      }),
      {
        name: 'oauth-store',
      }
    ),
    {
      name: 'oauth-store',
    }
  )
);

export const resetOAuthStore = () =>
  useOAuthStore.getState().resetConnections();
