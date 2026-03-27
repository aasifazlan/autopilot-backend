// src/modules/scheduling/scheduling.controller.ts

import { Response } from "express"
import { AuthRequest } from "../../middleware/auth.middleware"
import { SchedulingService } from "./scheduling.service"

const schedulingService = new SchedulingService()

type SchedulingMode = "overwrite" | "preserve" | "extend"

const ALLOWED_MODES: SchedulingMode[] = [
  "overwrite",
  "preserve",
  "extend"
]

// =========================
// 🚀 RUN SCHEDULER
// =========================
export const runScheduler = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const userId = req.user?.userId

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      })
    }

    // ✅ Validate mode safely
    const rawMode = req.query.mode as string | undefined

    const mode: SchedulingMode =
      rawMode && ALLOWED_MODES.includes(rawMode as SchedulingMode)
        ? (rawMode as SchedulingMode)
        : "preserve"

    console.log("📥 Mode received:", rawMode)
    console.log("⚙️ Mode applied:", mode)
    console.log("👤 User:", userId)

    const result =
      await schedulingService.runSevenDayScheduler(userId, mode as any)

    return res.status(200).json({
      success: true,
      ...result
    })

  } catch (error: any) {

    console.error("❌ Scheduler error:", error)

    return res.status(400).json({
      success: false,
      message: error.message || "Scheduler failed"
    })
  }
}

// =========================
// 📊 GET SCHEDULE
// =========================
export const getSchedule = async (
  req: AuthRequest,
  res: Response
) => {
  try {

    const userId = req.user?.userId

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
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

    console.log("📥 Fetch schedule:")
    console.log("👤 User:", userId)
    console.log("📅 Start:", startDate)
    console.log("📅 End:", endDate)

    const schedule = await schedulingService.getSchedule(
      userId,
      startDate,
      endDate
    )

    return res.status(200).json({
      success: true,
      count: schedule.length,
      data: schedule
    })

  } catch (error: any) {

    console.error("❌ Get schedule error:", error)

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch schedule"
    })
  }
}