import type { VideoProvider } from "./types";

interface DailyConfig {
  apiKey: string;
  domain?: string;
}

export function createDailyProvider(config: DailyConfig): VideoProvider {
  const baseUrl = "https://api.daily.co/v1";
  const domain = config.domain || "somove";

  return {
    name: "daily",

    async createRoom({ roomName }) {
      try {
        const response = await fetch(`${baseUrl}/rooms`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${config.apiKey}`,
          },
          body: JSON.stringify({
            name: roomName,
            properties: {
              enable_chat: true,
              enable_screenshare: false,
              enable_recording: false,
              enable_presentation: false,
              room_expiry: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
            },
          }),
        });

        if (!response.ok) {
          const err = await response.json();
          return { error: err.info || "Daily room creation failed" };
        }

        const data = await response.json();
        return { roomId: data.id };
      } catch (e) {
        return { error: e instanceof Error ? e.message : "Daily room creation failed" };
      }
    },

    async createJoinUrl({ roomName, displayName, isPresenter }) {
      try {
        const response = await fetch(`${baseUrl}/meeting-tokens`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${config.apiKey}`,
          },
          body: JSON.stringify({
            properties: {
              room_name: roomName,
              user_name: isPresenter ? `${displayName} (Host)` : displayName,
              is_owner: isPresenter,
              exp: Math.floor(Date.now() / 1000) + 2 * 60 * 60,
            },
          }),
        });

        if (!response.ok) {
          const err = await response.json();
          return { error: err.info || "Daily token creation failed" };
        }

        const data = await response.json();
        const joinUrl = `https://${domain}.daily.co/${roomName}?t=${data.token}`;
        return { joinUrl };
      } catch (e) {
        return { error: e instanceof Error ? e.message : "Daily join URL failed" };
      }
    },

    async deleteRoom(roomName) {
      try {
        await fetch(`${baseUrl}/rooms/${roomName}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${config.apiKey}`,
          },
        });
      } catch {
        // Best effort cleanup
      }
    },
  };
}
