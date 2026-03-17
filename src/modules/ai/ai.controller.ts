import { Response } from "express"
import { AuthRequest } from "../../middleware/auth.middleware"
import { AIService } from "./ai.service"
import { TaskService } from "../task/task.service"
import { SchedulingService } from "../scheduling/scheduling.service"

const aiService = new AIService()
const taskService = new TaskService()
const schedulingService = new SchedulingService()

export const generatePlan = async (
  req: AuthRequest,
  res: Response
) => {

  try {

    const userId = req.user!.userId
    const { goal } = req.body

    const tasks = await aiService.generateTasks(
        goal.title,
        goal.description,
        goal.deadline
        )

    for (const task of tasks) {

      await taskService.createTask(userId, {
        title: task.title,
        estimatedMinutes: task.estimatedMinutes,
        importance: task.importance
      })

    }

    await schedulingService.runSevenDayScheduler(userId)

    res.json({
      message: "AI plan created and scheduled"
    })

  } catch (error: any) {

    res.status(400).json({ message: error.message })

  }

}