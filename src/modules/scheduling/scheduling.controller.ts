import { Response } from "express"
import { AuthRequest } from "../../middleware/auth.middleware"
import { SchedulingService } from "./scheduling.service"

const schedulingService = new SchedulingService()

export const runScheduler = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const userId = req.user!.userId

    const result =
      await schedulingService.runSevenDayScheduler(userId)

    res.status(200).json(result)
  } catch (error: any) {
    res.status(400).json({ message: error.message })
  }
}

export const getSchedule = async (
  req: AuthRequest,
  res: Response
) => {
  try {

    const userId = req.user?.userId


    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized: user not found in request"
      })
    }

    const startDate =
      typeof req.query.startDate === "string"
        ? req.query.startDate
        : undefined

    const endDate =
      typeof req.query.endDate === "string"
        ? req.query.endDate
        : undefined

    const schedule = await schedulingService.getSchedule(
      userId,
      startDate,
      endDate
    )
        console.log("User:", userId)
        console.log("Start:", startDate)
        console.log("End:", endDate)

    return res.status(200).json({
      success: true,
      count: schedule.length,
      data: schedule
    })

  } catch (error: any) {

    console.error("Get schedule error:", error)

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch schedule"
    })
  }
}