// src/infrastructure/repositories/task.repository.ts

import { TaskModel } from "../database/task.model"
import { Task } from "../../shared/types"

export class TaskRepository {

  async create(data: Partial<Task>) {
    return TaskModel.create(data)
  }

  async findByUser(userId: string) {
    return TaskModel.find({ userId }).lean()
  }

  // ✅ FIXED VERSION
  async findPendingByUser(userId: string): Promise<Task[]> {

    const tasks = await TaskModel
      .find({
        userId,
        status: { $ne: "completed" }
      })
      .lean()

    return tasks.map((t: any): Task => ({
      id: t._id.toString(),
      userId: t.userId.toString(),
      goalId: t.goalId?.toString() ?? "",
      title: t.title,
      description: t.description,
      estimatedMinutes: t.estimatedMinutes,
      impactScore: t.impactScore,
      urgencyScore: t.urgencyScore,
      revenueScore: t.revenueScore,
      priorityScore: t.priorityScore ?? 0,
      status: t.status,
      createdAt: t.createdAt,
      deadline: t.deadline
    }))
  }

  async updatePriority(id: string, priorityScore: number) {
    return TaskModel.findByIdAndUpdate(id, { priorityScore })
  }

  async updateByUser(userId: string, taskId: string, data: any) {
    return TaskModel.findOneAndUpdate(
      { _id: taskId, userId },
      data,
      { new: true }
    )
  }

  async deleteByUser(userId: string, taskId: string) {
    return TaskModel.findOneAndDelete({
      _id: taskId,
      userId
    })
  }

  async markScheduled(id: string): Promise<void> {
    await TaskModel.findByIdAndUpdate(id, {
      status: "scheduled"
    })
  }
}