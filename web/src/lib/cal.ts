import type {
  CalApiResponse,
  CalUser,
  CalEventType,
  CalSlotsResponse,
  CalBooking,
  CreateEventTypeInput,
  CreateBookingInput,
} from "./cal.types";

const CAL_API_BASE = "https://api.cal.com/v2";
const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
  "cal-api-version": "2024-06-14",
};
const BOOKING_HEADERS = {
  "Content-Type": "application/json",
  "cal-api-version": "2026-02-25",
};

export class CalClient {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<CalApiResponse<T>> {
    try {
      const response = await fetch(`${CAL_API_BASE}${path}`, {
        ...options,
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          ...DEFAULT_HEADERS,
          ...options.headers,
        },
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        return {
          data: null,
          error: {
            message: body?.message || `HTTP ${response.status}: ${response.statusText}`,
            statusCode: response.status,
          },
        };
      }

      const result = await response.json();
      return { data: result.data ?? result, error: null };
    } catch (err) {
      return {
        data: null,
        error: {
          message: err instanceof Error ? err.message : "Unknown Cal.com API error",
        },
      };
    }
  }

  private async bookingRequest<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<CalApiResponse<T>> {
    try {
      const response = await fetch(`${CAL_API_BASE}${path}`, {
        ...options,
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          ...BOOKING_HEADERS,
          ...options.headers,
        },
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        return {
          data: null,
          error: {
            message: body?.message || `HTTP ${response.status}: ${response.statusText}`,
            statusCode: response.status,
          },
        };
      }

      const result = await response.json();
      return { data: result.data ?? result, error: null };
    } catch (err) {
      return {
        data: null,
        error: {
          message: err instanceof Error ? err.message : "Unknown Cal.com API error",
        },
      };
    }
  }

  async testConnection(): Promise<CalApiResponse<CalUser>> {
    return this.request<CalUser>("/me");
  }

  async getEventTypes(): Promise<CalApiResponse<CalEventType[]>> {
    return this.request<CalEventType[]>("/event-types");
  }

  async createEventType(
    input: CreateEventTypeInput
  ): Promise<CalApiResponse<CalEventType>> {
    return this.request<CalEventType>("/event-types", {
      method: "POST",
      body: JSON.stringify({
        title: input.title,
        slug: input.slug,
        lengthInMinutes: input.lengthInMinutes,
        description: input.description || "",
        locations: input.locations || [
          { type: "integration", integration: "cal-video" },
        ],
        minimumBookingNotice: input.minimumBookingNotice || 60,
        afterEventBuffer: input.afterEventBuffer || 15,
        beforeEventBuffer: input.beforeEventBuffer || 15,
        bookingLimitsCount: input.bookingLimitsCount,
      }),
    });
  }

  async getSlots(
    eventTypeId: number,
    start: string,
    end: string
  ): Promise<CalApiResponse<CalSlotsResponse>> {
    const params = new URLSearchParams({
      eventTypeId: String(eventTypeId),
      start,
      end,
    });
    return this.request<CalSlotsResponse>(`/slots?${params.toString()}`);
  }

  async createBooking(
    input: CreateBookingInput
  ): Promise<CalApiResponse<CalBooking>> {
    return this.bookingRequest<CalBooking>("/bookings", {
      method: "POST",
      body: JSON.stringify({
        eventTypeId: input.eventTypeId,
        start: input.start,
        attendee: input.attendee,
        metadata: input.metadata || {},
      }),
    });
  }

  async cancelBooking(uid: string): Promise<CalApiResponse<CalBooking>> {
    return this.bookingRequest<CalBooking>(`/bookings/${uid}/cancel`, {
      method: "POST",
    });
  }
}
