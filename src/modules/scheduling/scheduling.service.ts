// src/modules/scheduling/scheduling.service.ts

import { TaskRepository } from "../../infrastructure/repositories/task.repository"
import { ScheduleBlockModel } from "../../infrastructure/database/scheduleBlock.model"
import {
  generateFreeTimeSlots,
  CalendarEvent
} from "../../core/scheduling/timeSlotGenerator"
import {
  allocateTasksToSlots,
  AllocationResult
} from "../../core/scheduling/slotAllocator"
import { Task } from "../../shared/types"
import { calculatePriority } from "../../core/priority/calculatePriority"
import User from "../../infrastructure/database/user.model"
import { GoogleCalendarService } from "../../infrastructure/calendar/googleCalendar.service"

const googleCalendarService = new GoogleCalendarService()

type SchedulingMode = "overwrite" | "preserve" | "extend"

export class SchedulingService {

  private taskRepo = new TaskRepository()

  async runSevenDayScheduler(
    userId: string,
    mode: SchedulingMode = "preserve"
  ): Promise<{ message: string }> {

    const user = await User.findById(userId)
    if (!user) throw new Error("User not found")

    console.log("👤 USER:", userId)
    console.log("⚙️ MODE:", mode)

    const existingBlocks = await ScheduleBlockModel.find({ userId })

    // =========================
    // 🧠 MODE LOGIC
    // =========================

    if (mode === "preserve" && existingBlocks.length > 0) {
      return {
        message:
          "⚠️ Schedule exists. Use ?mode=overwrite or ?mode=extend"
      }
    }

    if (mode === "overwrite") {
      await this.clearAll(user, existingBlocks)
    }

    // =========================
    // 🔥 BUSY EVENTS BASE
    // =========================

    const busyEvents: CalendarEvent[] =
      mode === "extend"
        ? existingBlocks.map(b => ({
            start: b.startTime,
            end: b.endTime
          }))
        : []

    // =========================
    // 📋 TASKS
    // =========================

    const tasks: Task[] =
      await this.taskRepo.findPendingByUser(userId)

    const taskPool = tasks.map(task => ({
      ...task,
      remainingMinutes: task.estimatedMinutes,
      priorityScore: 0
    }))

    const today = new Date()

    // =========================
    // 🔁 MAIN LOOP
    // =========================

    for (let day = 0; day < 7; day++) {

      const currentDate = new Date(today)
      currentDate.setDate(today.getDate() + day)

      console.log(`\n📅 DAY ${day + 1}`)

      // priority
      taskPool.forEach(task => {
        task.priorityScore = calculatePriority(task)
      })

      taskPool.sort((a, b) => b.priorityScore - a.priorityScore)

      const freeSlots = generateFreeTimeSlots(
        currentDate,
        busyEvents
      )

      if (freeSlots.length === 0) continue

      const remainingTasks = taskPool.filter(
        t => t.remainingMinutes > 0
      )

      if (remainingTasks.length === 0) break

      const allocations: AllocationResult[] =
        allocateTasksToSlots(remainingTasks, freeSlots)

      console.log("⚡ ALLOCATIONS:", allocations.length)

      // =========================
      // 📅 CREATE EVENTS
      // =========================

      for (const allocation of allocations) {

        const task = taskPool.find(
          t => t.id === allocation.taskId
        )

        if (!task) continue

        let googleEventId: string | null = null

        if (user.googleTokens) {
          try {
            const event =
              await googleCalendarService.createEvent(user, {
                summary: task.title,
                description: "Scheduled by Autopilot",
                start: {
                  dateTime: allocation.startTime.toISOString(),
                  timeZone: "Asia/Kolkata"
                },
                end: {
                  dateTime: allocation.endTime.toISOString(),
                  timeZone: "Asia/Kolkata"
                }
              })

            googleEventId = event.data.id || null

            console.log("✅ Event:", googleEventId)

          } catch (error: any) {
            console.error("❌ Calendar error:",
              error.response?.data || error.message
            )
          }
        }

        const newBlock = await ScheduleBlockModel.create({
          userId,
          taskId: allocation.taskId,
          startTime: allocation.startTime,
          endTime: allocation.endTime,
          status: "scheduled",
          googleEventId
        })

        // 🔥 CRITICAL FIX → ALWAYS update busyEvents
        busyEvents.push({
          start: newBlock.startTime,
          end: newBlock.endTime
        })

        task.remainingMinutes -= allocation.durationMinutes

        await this.taskRepo.markScheduled(allocation.taskId)
      }

      const unfinished = taskPool.some(
        t => t.remainingMinutes > 0
      )

      if (!unfinished) break
    }

    return {
      message: `✅ Schedule generated (${mode})`
    }
  }

  // =========================
  // 🗑️ CLEAR ALL
  // =========================

  private async clearAll(user: any, blocks: any[]) {

    console.log("🗑️ Clearing schedule")

    if (user.googleTokens) {
      for (const block of blocks) {
        if (block.googleEventId) {
          try {
            await googleCalendarService.deleteEvent(
              user,
              block.googleEventId
            )
          } catch (err) {
            console.error("❌ Delete failed:", err)
          }
        }
      }
    }

    await ScheduleBlockModel.deleteMany({
      userId: user._id
    })
  }

  // =========================
  // 📊 GET SCHEDULE
  // =========================

  async getSchedule(
    userId: string,
    startDate?: string,
    endDate?: string
  ) {

    const start = startDate
      ? new Date(startDate)
      : new Date()

    const end = endDate
      ? new Date(endDate)
      : new Date(start.getTime() + 7 * 86400000)

    const blocks = await ScheduleBlockModel.find({
      userId,
      startTime: { $gte: start, $lte: end }
    })
      .populate("taskId")
      .sort({ startTime: 1 })

    return blocks.map(b => ({
      taskTitle: (b.taskId as any).title,
      start: b.startTime,
      end: b.endTime
    }))
  }
}