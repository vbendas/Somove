import { getSettingsContext } from "../data";
import { AvailabilityEditor } from "./availability-editor";
import type { AvailabilityData } from "../constants";

export const dynamic = "force-dynamic";

const DEFAULT_AVAILABILITY: AvailabilityData = {
  weekly: {
    monday: ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"],
    tuesday: ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"],
    wednesday: ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"],
    thursday: ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"],
    friday: ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"],
  },
  overrides: {},
  bufferMinutes: 15,
  timezone: "Europe/Lisbon",
};

export default async function AvailabilitySettingsPage() {
  const { profile } = await getSettingsContext();

  const availability = profile?.availability_rules
    ? (profile.availability_rules as unknown as AvailabilityData)
    : DEFAULT_AVAILABILITY;

  return (
    <AvailabilityEditor
      initial={{
        timezone: profile?.timezone || "Europe/Lisbon",
        availability,
      }}
    />
  );
}
