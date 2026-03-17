// src/infrastructure/database/task.model.ts

import { Schema, model } from "mongoose"

const taskSchema = new Schema(
  {
    goalId: { type: Schema.Types.ObjectId, ref: "Goal" },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    description: {type: String},
    estimatedMinutes: { type: Number, required: true },
    impactScore: { type: Number, required: true },
    urgencyScore: { type: Number, required: true },
    revenueScore: { type: Number, required: true },
    priorityScore: { type: Number },
    deadline:{type: Date, required: true},
    status: {
      type: String,
      enum: ["pending", "scheduled", "completed"],
      default: "pending",
    },
  },
  { timestamps: true }
)

taskSchema.index({ userId: 1, status: 1 })
taskSchema.index({ userId: 1, deadline: 1 })

export const TaskModel = model("Task", taskSchema)