import {
  updateUserGoogleTokens,
  type WeeklyDigestUser,
} from "@/database/auth/users";
import type { CalendarEvent } from "@/features/welcome/types/apiTypesCalendar";

/** Refresh access tokens this many ms before they expire. */
const TOKEN_EXPIRY_BUFFER_MS = 60_000;

export type RefreshedGoogleToken = {
  accessToken: string;
  expiresAt: Date;
};

/**
 * Exchange a Google refresh token for a new access token.
 * Does not log secrets.
 *
 * @param refreshToken - User's Google OAuth refresh token
 */
export async function refreshGoogleAccessToken(
  refreshToken: string
): Promise<RefreshedGoogleToken> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Google OAuth credentials are not configured");
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to refresh Google access token");
  }

  const data = (await response.json()) as {
    access_token: string;
    expires_in: number;
  };

  return {
    accessToken: data.access_token,
    expiresAt: new Date(Date.now() + data.expires_in * 1000),
  };
}

/**
 * Return a usable Google access token for the user.
 * Reuses the stored token when it remains valid past a 60s buffer;
 * otherwise refreshes and persists the new token.
 *
 * @param user - Digest-eligible user with Google tokens
 */
export async function getValidAccessToken(
  user: WeeklyDigestUser
): Promise<string> {
  const expiresAtMs = user.google_token_expires_at
    ? new Date(user.google_token_expires_at).getTime()
    : 0;
  const stillValid =
    Boolean(user.google_access_token) &&
    expiresAtMs > Date.now() + TOKEN_EXPIRY_BUFFER_MS;

  if (stillValid && user.google_access_token) {
    return user.google_access_token;
  }

  const refreshed = await refreshGoogleAccessToken(user.google_refresh_token);

  await updateUserGoogleTokens(user.id, {
    accessToken: refreshed.accessToken,
    expiresAt: refreshed.expiresAt,
  });

  return refreshed.accessToken;
}

/**
 * Fetch all events from the user's primary Google Calendar in [timeMin, timeMax).
 * Paginates until Google returns no nextPageToken.
 *
 * @param accessToken - Valid Google OAuth access token
 * @param timeMin - Range start (RFC3339)
 * @param timeMax - Range end exclusive (RFC3339)
 */
export async function fetchPrimaryCalendarEvents(
  accessToken: string,
  timeMin: string,
  timeMax: string
): Promise<CalendarEvent[]> {
  const allEvents: CalendarEvent[] = [];
  let pageToken: string | null = null;

  do {
    const urlParams = new URLSearchParams({
      timeMin,
      timeMax,
      maxResults: "250",
      singleEvents: "true",
      orderBy: "startTime",
    });

    if (pageToken) {
      urlParams.set("pageToken", pageToken);
    }

    const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?${urlParams.toString()}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch Google Calendar events");
    }

    const data = (await response.json()) as {
      items?: CalendarEvent[];
      nextPageToken?: string;
    };

    allEvents.push(...(data.items ?? []));
    pageToken = data.nextPageToken ?? null;
  } while (pageToken);

  return allEvents;
}
