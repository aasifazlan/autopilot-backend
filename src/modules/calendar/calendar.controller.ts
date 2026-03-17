import { Response } from "express"
import { GoogleCalendarService } from "../../infrastructure/calendar/googleCalendar.service"
import User from "../../infrastructure/database/user.model"
import { AuthRequest } from "../../middleware/auth.middleware"

const calendarService = new GoogleCalendarService()

export const connectGoogle = (req: AuthRequest, res: Response) => {

  const userId = req.user!.userId
  // const userId = "69b04d5a3d06f10644febf7b"

  const url = calendarService.generateAuthUrl(userId)

  res.redirect(url)
}

export const googleCallback = async (req: AuthRequest, res: Response) => {

  try {

    const code = req.query.code as string
    const userId = req.query.state as string

    const tokens = await calendarService.getTokens(code)

    await User.findByIdAndUpdate(userId, {
      googleAccessToken: tokens.access_token,
      googleRefreshToken: tokens.refresh_token,
      googleTokenExpiry: tokens.expiry_date
    })

    res.send("Google Calendar connected successfully")

  } catch (error) {

    console.error(error)

    res.status(500).send("Google connection failed")

  }

}