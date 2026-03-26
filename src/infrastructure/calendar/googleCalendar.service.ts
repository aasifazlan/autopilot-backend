import { google } from "googleapis"

function createOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  )
}

export class GoogleCalendarService {

  // 🔗 Generate Google Auth URL
  generateAuthUrl(userId: string) {
    const oauth2Client = createOAuthClient()

    return oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: ["https://www.googleapis.com/auth/calendar.events"],
      state: userId,
      prompt: "consent"
    })
  }

  // 🔑 Exchange code for tokens
  async getTokens(code: string) {
    const oauth2Client = createOAuthClient()
    const { tokens } = await oauth2Client.getToken(code)
    return tokens
  }

  // ⚙️ Internal helper to get calendar client
  private async getCalendarClient(user: any) {
    if (!user.googleTokens) {
      throw new Error("Google not connected")
    }

    const oauth2Client = createOAuthClient()

    oauth2Client.setCredentials(user.googleTokens)

    // 🔥 Auto-refresh tokens
    oauth2Client.on("tokens", async (newTokens) => {
      if (newTokens.access_token) {
        user.googleTokens = {
          ...user.googleTokens,
          ...newTokens
        }
        await user.save()
        console.log("🔄 Tokens refreshed")
      }
    })

    return google.calendar({
      version: "v3",
      auth: oauth2Client
    })
  }

  // 📅 Create event
  async createEvent(user: any, eventData: any) {
    try {
      const calendar = await this.getCalendarClient(user)

      const response = await calendar.events.insert({
        calendarId: "primary",
        requestBody: eventData
      })

      // console.log("✅ Event created:", response.data.id)

      return response

    } catch (error: any) {
      console.error("❌ Create Event Error:")
      console.error(error.response?.data || error.message)
      throw error
    }
  }

  // 🗑️ Delete event
  async deleteEvent(user: any, eventId: string) {

    if (!eventId) return

    try {
      const calendar = await this.getCalendarClient(user)

      await calendar.events.delete({
        calendarId: "primary",
        eventId
      })

      console.log("🗑️ Event deleted:", eventId)

    } catch (error: any) {

      // Ignore already deleted events
      if (error.code === 404) {
        console.warn("⚠️ Event already deleted:", eventId)
        return
      }

      console.error("❌ Delete Event Error:")
      console.error(error.response?.data || error.message)

      throw error
    }
  }
}