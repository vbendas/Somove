import type {
  MiroTalkMeetingResponse,
  MiroTalkJoinParams,
  MiroTalkJoinResponse,
  MiroTalkTokenParams,
  MiroTalkTokenResponse,
  MiroTalkApiResponse,
} from "./mirotalk.types";

export class MiroTalkClient {
  private apiUrl: string;
  private apiKey: string;

  constructor(apiUrl: string, apiKey: string) {
    this.apiUrl = apiUrl.replace(/\/$/, "");
    this.apiKey = apiKey;
  }

  private async request<T>(
    endpoint: string,
    method: "GET" | "POST" = "GET",
    body?: unknown
  ): Promise<MiroTalkApiResponse<T>> {
    try {
      const headers: Record<string, string> = {
        authorization: this.apiKey,
        "Content-Type": "application/json",
      };

      const config: RequestInit = { method, headers };

      if (body && method === "POST") {
        config.body = JSON.stringify(body);
      }

      const response = await fetch(
        `${this.apiUrl}/api/v1/${endpoint}`,
        config
      );

      const data = await response.json();

      if (data.error) {
        return { data: null, error: { message: data.error } };
      }

      return { data: data as T, error: null };
    } catch (e) {
      return {
        data: null,
        error: {
          message: e instanceof Error ? e.message : "MiroTalk request failed",
        },
      };
    }
  }

  async createRoom(): Promise<MiroTalkApiResponse<MiroTalkMeetingResponse>> {
    return this.request<MiroTalkMeetingResponse>("meeting", "POST");
  }

  async getJoinUrl(
    params: MiroTalkJoinParams
  ): Promise<MiroTalkApiResponse<MiroTalkJoinResponse>> {
    return this.request<MiroTalkJoinResponse>("join", "POST", {
      room: params.room,
      name: params.name,
      avatar: params.avatar ?? false,
      audio: params.audio ?? true,
      video: params.video ?? true,
      screen: params.screen ?? false,
      chat: params.chat ?? false,
      hide: params.hide ?? false,
      notify: params.notify ?? true,
      duration: params.duration ?? "unlimited",
      token: params.token,
    });
  }

  async createToken(
    params: MiroTalkTokenParams
  ): Promise<MiroTalkApiResponse<MiroTalkTokenResponse>> {
    return this.request<MiroTalkTokenResponse>("token", "POST", {
      username: params.username,
      password: params.password,
      presenter: params.presenter,
      expire: params.expire ?? "1h",
    });
  }
}

let _client: MiroTalkClient | null = null;

export function getMiroTalkClient(): MiroTalkClient | null {
  const url = process.env.MIROTALK_URL;
  const apiKey = process.env.MIROTALK_API_KEY;

  if (!url || !apiKey) return null;

  if (!_client) {
    _client = new MiroTalkClient(url, apiKey);
  }

  return _client;
}
