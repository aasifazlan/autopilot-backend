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

export class SchedulingService {

  private taskRepo = new TaskRepository()

  async runSevenDayScheduler(userId: string): Promise<{ message: string }> {

    // 🔥 Get user first (needed for calendar ops)
    const user = await User.findById(userId)
    console.log("👤 USER FROM DB:", user)
    console.log("🆔 Scheduler userId:", userId)
    console.log("🔑 TOKENS IN SCHEDULER:", user?.googleTokens)

    // 🔥 OPTIONAL: Delete old calendar events before clearing DB
    if (user?.googleTokens) {
      const oldBlocks = await ScheduleBlockModel.find({ userId })
      console.log("USER TOKENS:", user?.googleTokens)

      for (const block of oldBlocks) {
        if (block.googleEventId) {
          try {
            await googleCalendarService.deleteEvent(
              user,
              block.googleEventId
            )
          } catch (err) {
            console.error("❌ Failed to delete old event:", err)
          }
        }
      }
    }

    // Remove previous schedule from DB
    await ScheduleBlockModel.deleteMany({ userId })

    const tasks: Task[] = await this.taskRepo.findPendingByUser(userId)

    const taskPool = tasks.map(task => ({
      ...task,
      remainingMinutes: task.estimatedMinutes
    }))

    const today = new Date()

    for (let day = 0; day < 7; day++) {

      const currentDate = new Date(today)
      currentDate.setDate(today.getDate() + day)

      // 🔁 Recalculate priority daily
      taskPool.forEach(task => {
        task.priorityScore = calculatePriority(task)
      })

      // Sort by priority
      taskPool.sort((a, b) => b.priorityScore - a.priorityScore)

      // ⚠️ Currently empty — later replace with real Google busy events
      const busyEvents: CalendarEvent[] = []

      const freeSlots = generateFreeTimeSlots(currentDate, busyEvents)

      if (freeSlots.length === 0) continue

      const remainingTasks = taskPool.filter(
        t => t.remainingMinutes > 0
      )

      const allocations: AllocationResult[] =
        allocateTasksToSlots(remainingTasks, freeSlots)
        console.log("TASK COUNT:", tasks.length)
        console.log("FREE SLOTS:", freeSlots.length)
        console.log("ALLOCATIONS:", allocations.length)

      for (const allocation of allocations) {

        const task = taskPool.find(
          t => t.id === allocation.taskId
        )

        if (!task) continue

        let googleEventId: string | null = null

        // ✅ FIXED: Use user.googleTokens instead of manual tokens
        if (user?.googleTokens) {
          try {

            const event = await googleCalendarService.createEvent(user, {
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

            console.log("✅ Event created:", googleEventId)

          } catch (error: any) {

            console.error("❌ Google Calendar FULL ERROR:")
            console.error(
              error.response?.data || error.message || error
            )

          }
        }

        // Save schedule block
        await ScheduleBlockModel.create({
          userId,
          taskId: allocation.taskId,
          startTime: allocation.startTime,
          endTime: allocation.endTime,
          status: "scheduled",
          googleEventId
        })

        // Reduce remaining time
        task.remainingMinutes -= allocation.durationMinutes

        // Mark task scheduled
        await this.taskRepo.markScheduled(allocation.taskId)

      }

      // Stop early if all tasks done
      const unfinished = taskPool.some(
        t => t.remainingMinutes > 0
      )

      if (!unfinished) break
    }

    return { message: "7-day schedule generated successfully" }
  }

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
      : new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000)

    const blocks = await ScheduleBlockModel.find({
      userId,
      startTime: {
        $gte: start,
        $lte: end
      }
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