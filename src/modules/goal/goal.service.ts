// src/modules/goal/goal.service.ts

import {GoalModel} from "../../infrastructure/database/goal.model"

export class GoalService {

  async createGoal(userId: string, data: any) {

    const goal = await GoalModel.create({
      ...data,
      userId
    })

    return goal
  }

  async getGoals(userId: string) {

    const goals = await GoalModel
      .find({ userId })
      .sort({ createdAt: -1 })

    return goals
  }

  async getGoal(userId: string, goalId: string) {

    const goal = await GoalModel.findOne({
      _id: goalId,
      userId
    })

    if (!goal) {
      throw new Error("Goal not found")
    }

    return goal
  }

  async deleteGoal(userId: string, goalId: string) {

    const goal = await GoalModel.findOneAndDelete({
      _id: goalId,
      userId
    })

    if (!goal) {
      throw new Error("Goal not found")
    }

    return goal
  }

}