import { google } from "googleapis";

/**
 * Google Calendar integration for OlivHairSupply bookings.
 *
 * Setup (one-time):
 * 1. Go to https://console.cloud.google.com
 * 2. Create a project → Enable "Google Calendar API"
 * 3. Create credentials → Service Account → download JSON key
 * 4. Share your Google Calendar with the service account email (give it "Make changes to events" access)
 * 5. Set these env vars in Vercel:
 *    GOOGLE_SERVICE_ACCOUNT_EMAIL  = the service account email (e.g. olivbooking@project.iam.gserviceaccount.com)
 *    GOOGLE_SERVICE_ACCOUNT_KEY    = the private_key from the JSON file (include -----BEGIN ... -----END-----)
 *    GOOGLE_CALENDAR_ID            = the calendar ID (usually your Google email or a dedicated calendar ID)
 */

export interface CalendarEventInput {
  summary: string;        // e.g. "Tresse Einnähen — Olivia M."
  description: string;    // full booking details
  location: string;       // salon address
  startIso: string;       // ISO 8601 e.g. "2026-06-15T10:00:00+02:00"
  endIso: string;
  attendeeEmail?: string; // customer email — sends them a Google Calendar invite
  source?: string;        // website | whatsapp | facebook | instagram
}

function getAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

  if (!email || !rawKey) return null;

  // Vercel stores the key as a single-line string with literal \n
  const privateKey = rawKey.replace(/\\n/g, "\n");

  return new google.auth.GoogleAuth({
    credentials: { client_email: email, private_key: privateKey },
    scopes: ["https://www.googleapis.com/auth/calendar"],
  });
}

export async function createCalendarEvent(input: CalendarEventInput): Promise<string | null> {
  const auth = getAuth();
  if (!auth) {
    console.warn("[GoogleCalendar] Credentials not configured — skipping calendar sync.");
    return null;
  }

  const calendarId = process.env.GOOGLE_CALENDAR_ID || "olivhairbooking@gmail.com";

  try {
    const calendar = google.calendar({ version: "v3", auth });

    const attendees = input.attendeeEmail
      ? [{ email: input.attendeeEmail, displayName: "Customer" }]
      : [];

    const event = await calendar.events.insert({
      calendarId,
      sendUpdates: "all",   // sends Google Calendar invite to attendee
      requestBody: {
        summary: input.summary,
        description: input.description,
        location: input.location,
        start: { dateTime: input.startIso, timeZone: "Europe/Berlin" },
        end:   { dateTime: input.endIso,   timeZone: "Europe/Berlin" },
        attendees,
        colorId: "5",  // banana yellow — stands out for bookings
        extendedProperties: {
          private: { source: input.source || "website" }
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: "email",  minutes: 1440 }, // 24h before
            { method: "popup",  minutes: 60   }, // 1h before
          ],
        },
      },
    });

    return event.data.id ?? null;
  } catch (err) {
    console.error("[GoogleCalendar] Failed to create event:", err);
    return null;
  }
}

/** Delete a calendar event by its Google event ID */
export async function deleteCalendarEvent(googleEventId: string): Promise<void> {
  const auth = getAuth();
  if (!auth) return;
  const calendarId = process.env.GOOGLE_CALENDAR_ID || "olivhairbooking@gmail.com";
  try {
    const calendar = google.calendar({ version: "v3", auth });
    await calendar.events.delete({ calendarId, eventId: googleEventId });
  } catch (err) {
    console.error("[GoogleCalendar] Failed to delete event:", err);
  }
}
