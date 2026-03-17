import cron from "node-cron"
import { ScheduleBlockModel } from "../infrastructure/database/scheduleBlock.model"
import { TaskModel } from "../infrastructure/database/task.model"
import { SchedulingService } from "../modules/scheduling/scheduling.service"

const schedulingService = new SchedulingService()

export const startRescheduler = () => {

  cron.schedule("0 */2 * * *", async () => {

    console.log("🔁 Rescheduler started")

    try {

      const now = new Date()

      const blocks = await ScheduleBlockModel.find({
        endTime: { $lte: now },
        status: "scheduled"
      })

      for (const block of blocks) {

        const task = await TaskModel.findById(block.taskId)

        if (!task) continue

        const missedMinutes =
          (block.endTime.getTime() - block.startTime.getTime()) / 60000

        task.estimatedMinutes += missedMinutes
        task.status = "pending"

        await task.save()

        await ScheduleBlockModel.deleteOne({ _id: block._id })

      }

      const users = await TaskModel.distinct("userId")

      for (const userId of users) {

        await schedulingService.runSevenDayScheduler(
          userId.toString()
        )

      }

      console.log("✅ Rescheduler completed")

    } catch (error) {

      console.error("❌ Rescheduler error:", error)

    }

  })

}