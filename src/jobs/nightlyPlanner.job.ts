import cron from "node-cron"
import User from "../infrastructure/database/user.model"
import { SchedulingService } from "../modules/scheduling/scheduling.service"

const schedulingService = new SchedulingService()

export const startNightlyPlanner = () => {

  // Runs every night at 1:00 AM
  cron.schedule("0 1 * * *", async () => {

    console.log("🌙 Nightly planner started")

    try {

      const users = await User.find()

      for (const user of users) {

        console.log(`Scheduling for user: ${user.email}`)

        await schedulingService.runSevenDayScheduler(user._id.toString())
      }

      console.log("✅ Nightly planning completed")

    } catch (error) {

      console.error("❌ Nightly planner error:", error)

    }

  })

}