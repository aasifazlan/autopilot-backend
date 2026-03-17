// src/scripts/runScheduler.ts

import { SchedulingService } from "../modules/scheduling/scheduling.service"
import { TaskModel } from "../infrastructure/database/task.model"
import { calculatePriority } from "../core/priority/calculatePriority"
import { ScheduleBlockModel } from "../infrastructure/database/scheduleBlock.model"
import userModel from "../infrastructure/database/user.model"
import connectDB from "../config/db"
import dotenv from "dotenv"

dotenv.config()

async function seedTasks(): Promise<string> {

  await TaskModel.deleteMany({})
  await ScheduleBlockModel.deleteMany({})

  const user = await userModel.findOne()

  if (!user) {
    console.log("No user found in DB. Create a user first.")
    process.exit(1)
  }

  const today = new Date()

  const tasks = await TaskModel.create([
    {
      userId: user._id,
      title: "DSA Practice",
      estimatedMinutes: 120,
      impactScore: 5,
      urgencyScore: 4,
      revenueScore: 3,
      priorityScore: 0,
      status: "pending",
      deadline: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000),
    },
    {
      userId: user._id,
      title: "System Design Study",
      estimatedMinutes: 180,
      impactScore: 5,
      urgencyScore: 3,
      revenueScore: 4,
      priorityScore: 0,
      status: "pending",
      deadline: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000),
    },
    {
      userId: user._id,
      title: "Backend Project Work",
      estimatedMinutes: 240,
      impactScore: 4,
      urgencyScore: 4,
      revenueScore: 5,
      priorityScore: 0,
      status: "pending",
      deadline: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000),
    }
  ])

  for (const task of tasks) {
    if (!task.deadline) continue

    const score = calculatePriority({
      estimatedMinutes: task.estimatedMinutes,
      impactScore: task.impactScore,
      urgencyScore: task.urgencyScore,
      revenueScore: task.revenueScore,
      deadline: task.deadline,
    })

    task.priorityScore = score
    await task.save()
  }

  return user._id.toString()
}

function formatTime(date: Date) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

async function printSchedule() {

  const blocks = await ScheduleBlockModel.find()
    .populate("taskId")
    .sort({ startTime: 1 })

  const grouped: Record<string, any[]> = {}

  for (const block of blocks) {
    const day = block.startTime.toDateString()
    if (!grouped[day]) grouped[day] = []
    grouped[day].push(block)
  }

  console.log("\n📅 ===== 7 Day Schedule =====\n")

  for (const day in grouped) {
    console.log(`\n🗓 ${day}`)
    console.log("────────────────────────")

    for (const block of grouped[day]) {
      const taskTitle = (block.taskId as any).title
      console.log(
        `${formatTime(block.startTime)} - ${formatTime(block.endTime)} → ${taskTitle}`
      )
    }
  }

  console.log("\n✅ Scheduling Complete\n")
}

async function main() {

  await connectDB()

  const userId = await seedTasks()

  const scheduler = new SchedulingService()

  await scheduler.runSevenDayScheduler(userId)

  await printSchedule()

  process.exit(0)
}

main()