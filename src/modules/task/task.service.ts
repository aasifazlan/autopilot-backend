// src/modules/task/task.service.ts

import { calculatePriority } from "../../core/priority/calculatePriority"
import { TaskRepository } from "../../infrastructure/repositories/task.repository"

export class TaskService {

  private repo = new TaskRepository()

  async createTask(userId: string, data: any) {

    return this.repo.create({
      ...data,
      userId,
      remainingMinutes: data.estimatedMinutes,
      status: "pending"
    })
  }

  async getTasks(userId: string) {
    return this.repo.findByUser(userId)
  }

  async updateTask(userId: string, taskId: string, data: any) {

    const task = await this.repo.updateByUser(userId, taskId, data)

    if (!task) throw new Error("Task not found")

    return task
  }

  async deleteTask(userId: string, taskId: string) {

    const task = await this.repo.deleteByUser(userId, taskId)

    if (!task) throw new Error("Task not found")
  }

  async scorePendingTasks(userId: string) {

    const tasks = await this.repo.findPendingByUser(userId)
    

    for (const task of tasks) {

      if (!task.deadline) continue

      const score = calculatePriority(task)

      await this.repo.updatePriority(task.id, score)
    }
  }
}