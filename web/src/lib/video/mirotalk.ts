import type { VideoProvider } from "./types";

interface MiroTalkConfig {
  url: string;
  apiKey: string;
}

export function createMiroTalkProvider(config: MiroTalkConfig): VideoProvider {
  return {
    name: "mirotalk",

    async createRoom({ roomName }) {
      try {
        const response = await fetch(`${config.url}/api/v1/meeting`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${config.apiKey}`,
          },
          body: JSON.stringify({ room: roomName }),
        });

        const data = await response.json();
        if (data.error) {
          return { error: JSON.stringify(data.error) };
        }
        return { roomId: data.meeting || roomName };
      } catch (e) {
        return { error: e instanceof Error ? e.message : "MiroTalk room creation failed" };
      }
    },

    async createJoinUrl({ roomName, displayName, isPresenter, password }) {
      try {
        const params: Record<string, unknown> = {
          room: roomName,
          name: isPresenter ? `${displayName} (Host)` : displayName,
          audio: true,
          video: true,
          screen: false,
          chat: true,
          hide: false,
          notify: false,
          duration: 0,
        };

        if (password) {
          params.token = {
            username: isPresenter ? "therapist" : "client",
            password,
            presenter: isPresenter,
            expire: "2h",
          };
        }

        const response = await fetch(`${config.url}/api/v1/join`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${config.apiKey}`,
          },
          body: JSON.stringify(params),
        });

        const data = await response.json();
        if (data.error) {
          return { error: JSON.stringify(data.error) };
        }
        return { joinUrl: data.join };
      } catch (e) {
        return { error: e instanceof Error ? e.message : "MiroTalk join URL failed" };
      }
    },

    async deleteRoom() {
      // MiroTalk rooms auto-delete after expiry, no explicit delete needed
    },
  };
}
