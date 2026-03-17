import { google } from "googleapis"

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
)

export class GoogleCalendarService {

  generateAuthUrl(userId: string) {

    const scopes = [
      "https://www.googleapis.com/auth/calendar.events"
    ]

    return oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: scopes,
      state: userId,
      prompt: "consent"
    })
  }

  async getTokens(code: string) {

    const { tokens } = await oauth2Client.getToken(code)

    return tokens
  }

  async createEvent(tokens: any, eventData: any) {

    oauth2Client.setCredentials(tokens)

    const calendar = google.calendar({
      version: "v3",
      auth: oauth2Client
    })

    return calendar.events.insert({
      calendarId: "primary",
      requestBody: eventData
    })
  }

}