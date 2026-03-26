import { Response } from "express"
import { GoogleCalendarService } from "../../infrastructure/calendar/googleCalendar.service"
import User from "../../infrastructure/database/user.model"
import { AuthRequest } from "../../middleware/auth.middleware"
import userModel from "../../infrastructure/database/user.model"

const calendarService = new GoogleCalendarService()

// 🔗 Step 1: Redirect user to Google
export const connectGoogle = async(req: AuthRequest, res: Response) => {
  

  // const userId = req.user?.userId
  const user = await userModel.findOne({email:"aasiffilms79@gmail.com"})
  console.log(user)
  const userId= user?._id.toString()

  if (!userId) {
    return res.status(401).send("Unauthorized")
  }

  const url = calendarService.generateAuthUrl(userId)

  res.redirect(url)
}

// 🔗 Step 2: Google callback
export const googleCallback = async (req: AuthRequest, res: Response) => {

  try {

    const code = req.query.code as string
    const userId = req.query.state as string

    if (!code || !userId) {
      return res.status(400).send("Missing code or state")
    }

    const tokens = await calendarService.getTokens(code)

    console.log("🔑 TOKENS RECEIVED:", tokens)

    // ✅ Save full token object
    await User.findByIdAndUpdate(userId, {
      googleTokens: tokens
    })

    console.log("✅ Google connected for user:", userId)

    res.send("Google Calendar connected successfully")

  } catch (error: any) {

    console.error("❌ Google OAuth Error:")
    console.error(error.response?.data || error.message || error)

    res.status(500).send("Google connection failed")

  }

}