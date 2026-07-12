export const TIMEZONES = [
  "Europe/Lisbon",
  "Europe/London",
  "Europe/Berlin",
  "Europe/Paris",
  "Europe/Madrid",
  "Europe/Rome",
  "America/New_York",
  "America/Chicago",
  "America/Los_Angeles",
  "UTC",
];

export const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
export const HOURS = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, "0")}:00`);
export const MINUTES = ["00", "30"];

export interface AvailabilityData {
  weekly: Record<string, string[]>;
  overrides: Record<string, string[]>;
  bufferMinutes: number;
  timezone: string;
}
