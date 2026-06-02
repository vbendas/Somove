export interface ChatwootContact {
  id: number;
  name: string;
  email: string;
  identifier?: string;
}

export interface ChatwootConversation {
  id: number;
  contact_id: number;
  inbox_id: number;
  status: "open" | "pending" | "snoozed" | "resolved";
  messages?: ChatwootMessage[];
}

export interface ChatwootMessage {
  id: number;
  content: string;
  message_type: "outgoing" | "incoming" | "activity";
  created_at: string;
}

export interface ChatwootApiResponse<T> {
  data: T | null;
  error: { message: string } | null;
}

export class ChatwootClient {
  private baseUrl: string;
  private accountId: string;
  private apiToken: string;

  constructor(baseUrl: string, accountId: string, apiToken: string) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.accountId = accountId;
    this.apiToken = apiToken;
  }

  private async request<T>(
    endpoint: string,
    method: "GET" | "POST" | "PUT" | "PATCH" = "GET",
    body?: unknown
  ): Promise<ChatwootApiResponse<T>> {
    try {
      const headers: Record<string, string> = {
        Authorization: `Bearer ${this.apiToken}`,
        "Content-Type": "application/json",
      };

      const config: RequestInit = { method, headers };
      if (body && (method === "POST" || method === "PUT" || method === "PATCH")) {
        config.body = JSON.stringify(body);
      }

      const response = await fetch(
        `${this.baseUrl}/api/v1/accounts/${this.accountId}/${endpoint}`,
        config
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          data: null,
          error: { message: errorData.error || `HTTP ${response.status}` },
        };
      }

      const data = await response.json();
      return { data, error: null };
    } catch (e) {
      return {
        data: null,
        error: { message: e instanceof Error ? e.message : "Chatwoot request failed" },
      };
    }
  }

  async createContact(
    name: string,
    email: string,
    identifier?: string
  ): Promise<ChatwootApiResponse<ChatwootContact>> {
    return this.request<ChatwootContact>("contacts", "POST", {
      name,
      email,
      identifier,
    });
  }

  async createConversation(
    contactId: number,
    inboxId: number
  ): Promise<ChatwootApiResponse<ChatwootConversation>> {
    return this.request<ChatwootConversation>("conversations", "POST", {
      contact_id: contactId,
      inbox_id: inboxId,
    });
  }

  async sendMessage(
    conversationId: number,
    message: string,
    isPrivate = false
  ): Promise<ChatwootApiResponse<ChatwootMessage>> {
    return this.request<ChatwootMessage>(
      `conversations/${conversationId}/messages`,
      "POST",
      {
        content: message,
        private: isPrivate,
      }
    );
  }

  async getConversation(
    conversationId: number
  ): Promise<ChatwootApiResponse<ChatwootConversation>> {
    return this.request<ChatwootConversation>(
      `conversations/${conversationId}`
    );
  }

  async getContactConversations(
    contactId: number
  ): Promise<ChatwootApiResponse<{ payload: ChatwootConversation[] }>> {
    return this.request<{ payload: ChatwootConversation[] }>(
      `contacts/${contactId}/conversations`
    );
  }

  async updateConversationStatus(
    conversationId: number,
    status: "open" | "pending" | "snoozed" | "resolved"
  ): Promise<ChatwootApiResponse<ChatwootConversation>> {
    return this.request<ChatwootConversation>(
      `conversations/${conversationId}`,
      "PATCH",
      { status }
    );
  }
}

let _client: ChatwootClient | null = null;

export function getChatwootClient(): ChatwootClient | null {
  const baseUrl = process.env.CHATWOOT_BASE_URL;
  const accountId = process.env.CHATWOOT_ACCOUNT_ID;
  const apiToken = process.env.CHATWOOT_API_TOKEN;

  if (!baseUrl || !accountId || !apiToken) return null;

  if (!_client) {
    _client = new ChatwootClient(baseUrl, accountId, apiToken);
  }

  return _client;
}
