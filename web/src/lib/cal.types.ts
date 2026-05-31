export interface CalUser {
  id: number;
  name: string;
  email: string;
  username: string;
  timeZone: string;
}

export interface CalEventType {
  id: number;
  title: string;
  slug: string;
  lengthInMinutes: number;
  description?: string;
  locations?: CalLocation[];
  status?: string;
}

export interface CalLocation {
  type: string;
  integration?: string;
}

export interface CalSlot {
  start: string;
  end: string;
}

export interface CalSlotsResponse {
  [date: string]: CalSlot[];
}

export interface CalBookingAttendee {
  name: string;
  email?: string;
  timeZone: string;
}

export interface CalBooking {
  id: number;
  uid: string;
  title: string;
  start: string;
  end: string;
  duration: number;
  status: string;
  attendees: Array<{
    name: string;
    email: string;
    timeZone: string;
  }>;
  location?: string;
}

export interface CalApiError {
  message: string;
  statusCode?: number;
}

export interface CalApiResponse<T> {
  data: T | null;
  error: CalApiError | null;
}

export interface CreateEventTypeInput {
  title: string;
  slug: string;
  lengthInMinutes: number;
  description?: string;
  locations?: CalLocation[];
  minimumBookingNotice?: number;
  afterEventBuffer?: number;
  beforeEventBuffer?: number;
  bookingLimitsCount?: {
    day?: number;
    week?: number;
  };
}

export interface CreateBookingInput {
  eventTypeId: number;
  start: string;
  attendee: CalBookingAttendee;
  metadata?: Record<string, string>;
}
