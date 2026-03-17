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

interface GoalParams {
    id:string
}

export const createGoal = async (
  req: AuthRequest,
  res: Response
) => {

  try {

    const userId = req.user!.userId

    // 1️⃣ Save goal
    const goal = await goalService.createGoal(
      userId,
      req.body
    )

    // 2️⃣ AI generates tasks
const aiTasks = await aiService.generateTasks(
  goal.title,
  goal.description ?? undefined,
  goal.deadline
)

// 3️⃣ Store tasks
for (const task of aiTasks) {

  const daysLeft =
    (new Date(goal.deadline).getTime() - Date.now()) /
    (1000 * 60 * 60 * 24)

  await taskService.createTask(userId, {

    goalId: goal._id,

    title: task.title,
    estimatedMinutes: task.estimatedMinutes,

    // required schema fields
    deadline: goal.deadline,

    impactScore: task.importance || 3,
    urgencyScore: daysLeft < 7 ? 5 : 3,
    revenueScore: 3

  })

}

    // 4️⃣ Run scheduler
    await schedulingService.runSevenDayScheduler(userId)

    res.status(201).json({
      message: "Goal created and scheduled",
      goal
    })

  } catch (error: any) {

    res.status(400).json({
      message: error.message
    })

  }

}

export const getGoals = async (
  req: AuthRequest,
  res: Response
) => {

  try {

    const userId = req.user!.userId

    const goals = await goalService.getGoals(userId)

    res.json(goals)

  } catch (error: any) {

    res.status(400).json({
      message: error.message
    })

  }

}

export const deleteGoal = async (
  req: AuthRequest & Request<GoalParams>,
  res: Response
) => {

  try {

    const userId = req.user!.userId

    await goalService.deleteGoal(
      userId,
      req.params.id
    )

    res.json({
      message: "Goal deleted"
    })

  } catch (error: any) {

    res.status(400).json({
      message: error.message
    })

  }

}