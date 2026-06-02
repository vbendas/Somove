export interface MiroTalkStatsResponse {
  rooms: number;
  users: number;
}

export interface MiroTalkMeetingsResponse {
  meetings: Record<string, { peers: Record<string, unknown> }>;
}

export interface MiroTalkMeetingResponse {
  meeting: string;
}

export interface MiroTalkJoinParams {
  room: string;
  name: string;
  avatar?: string | boolean;
  audio?: boolean;
  video?: boolean;
  screen?: boolean;
  chat?: boolean;
  hide?: boolean;
  notify?: boolean;
  duration?: string;
  token?: {
    username: string;
    password: string;
    presenter: boolean;
    expire?: string;
  };
}

export interface MiroTalkJoinResponse {
  join: string;
}

export interface MiroTalkTokenParams {
  username: string;
  password: string;
  presenter: boolean;
  expire?: string;
}

export interface MiroTalkTokenResponse {
  token: string;
}

export interface MiroTalkApiResponse<T> {
  data: T | null;
  error: { message: string } | null;
}
