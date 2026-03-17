import { Response } from "express"
import { AuthRequest } from "../../middleware/auth.middleware"
import { TaskService } from "./task.service"

const taskService = new TaskService()

export const createTask = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId
    const task = await taskService.createTask(userId, req.body)
    res.status(201).json(task)
  } catch (error: any) {
    res.status(400).json({ message: error.message })
  }
}

export const getTasks = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId
    const tasks = await taskService.getTasks(userId)
    res.status(200).json(tasks)
  } catch (error: any) {
    res.status(400).json({ message: error.message })
  }
}

export const updateTask = async (
    req: AuthRequest & {params: {id:string}},
    res: Response) => {
  try {
    const userId = req.user!.userId
    const updated = await taskService.updateTask(
      userId,
      req.params.id,
      req.body
    )
    res.status(200).json(updated)
  } catch (error: any) {
    res.status(400).json({ message: error.message })
  }
}

export const deleteTask = async (
    req: AuthRequest & {params: {id: string}},
     res: Response) => {
  try {
    const userId = req.user!.userId
    await taskService.deleteTask(userId, req.params.id)
    res.status(200).json({ message: "Task deleted" })
  } catch (error: any) {
    res.status(400).json({ message: error.message })
  }
}