export type VideoProviderName = "mirotalk" | "daily";

export interface VideoProvider {
  name: VideoProviderName;

  createRoom(params: {
    roomName: string;
  }): Promise<{ roomId: string } | { error: string }>;

  createJoinUrl(params: {
    roomName: string;
    displayName: string;
    isPresenter: boolean;
    password?: string;
  }): Promise<{ joinUrl: string } | { error: string }>;

  deleteRoom(roomName: string): Promise<void>;
}
