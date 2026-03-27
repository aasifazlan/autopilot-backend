// src/modules/goal/goal.controller.ts

import { Response, Request } from "express"
import { AuthRequest } from "../../middleware/auth.middleware"
import { GoalService } from "./goal.service"
import { AIService } from "../ai/ai.service"
import { TaskService } from "../task/task.service"
import { SchedulingService } from "../scheduling/scheduling.service"

const goalService = new GoalService()
const aiService = new AIService()
const taskService = new TaskService()
const schedulingService = new SchedulingService()

type SchedulingMode = "overwrite" | "preserve" | "extend"

const ALLOWED_MODES: SchedulingMode[] = [
  "overwrite",
  "preserve",
  "extend"
]

interface GoalParams {
  id: string
}

// =========================
// 🚀 CREATE GOAL
// =========================
export const createGoal = async (
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

    // ✅ Mode handling (default = overwrite for new goals)
    const rawMode = req.query.mode as string | undefined

    const mode: SchedulingMode =
      rawMode && ALLOWED_MODES.includes(rawMode as SchedulingMode)
        ? (rawMode as SchedulingMode)
        : "overwrite"

    console.log("🎯 Creating goal for user:", userId)
    console.log("⚙️ Scheduling mode:", mode)

    // =========================
    // 1️⃣ Create Goal
    // =========================
    const goal = await goalService.createGoal(userId, req.body)

    console.log("✅ Goal created:", goal._id)

    // =========================
    // 2️⃣ Generate AI Tasks
    // =========================
    const aiTasks = await aiService.generateTasks(
      goal.title,
      goal.description ?? undefined,
      goal.deadline
    )

    console.log("🤖 AI Tasks generated:", aiTasks.length)

    // =========================
    // 3️⃣ Store Tasks
    // =========================
    const daysLeft =
      (new Date(goal.deadline).getTime() - Date.now()) /
      (1000 * 60 * 60 * 24)

    for (const task of aiTasks) {
      await taskService.createTask(userId, {
        goalId: goal._id,
        title: task.title,
        estimatedMinutes: task.estimatedMinutes,
        deadline: goal.deadline,

        impactScore: task.importance || 3,
        urgencyScore: daysLeft < 7 ? 5 : 3,
        revenueScore: 3
      })
    }

    console.log("📦 Tasks saved to DB")

    // =========================
    // 4️⃣ Run Scheduler
    // =========================
    const scheduleResult =
      await schedulingService.runSevenDayScheduler(
        userId,
        mode
      )

    console.log("📅 Scheduler result:", scheduleResult.message)

    return res.status(201).json({
      success: true,
      message: "Goal created and scheduled",
      goal,
      scheduling: scheduleResult.message
    })

  } catch (error: any) {

    console.error("❌ Create goal error:", error)

    return res.status(400).json({
      success: false,
      message: error.message || "Failed to create goal"
    })
  }
}

// =========================
// 📊 GET GOALS
// =========================
export const getGoals = async (
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

    const goals = await goalService.getGoals(userId)

    return res.status(200).json({
      success: true,
      count: goals.length,
      data: goals
    })

  } catch (error: any) {

    console.error("❌ Get goals error:", error)

    return res.status(400).json({
      success: false,
      message: error.message
    })
  }
}

// =========================
// 🗑️ DELETE GOAL
// =========================
export const deleteGoal = async (
  req: AuthRequest & Request<GoalParams>,
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

    const goalId = req.params.id

    await goalService.deleteGoal(userId, goalId)

    console.log("🗑️ Goal deleted:", goalId)

    return res.status(200).json({
      success: true,
      message: "Goal deleted successfully"
    })

  } catch (error: any) {

    console.error("❌ Delete goal error:", error)

    return res.status(400).json({
      success: false,
      message: error.message
    })
  }
}