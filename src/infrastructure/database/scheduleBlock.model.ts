import { Schema, model } from "mongoose"

const scheduleBlockSchema = new Schema({
  taskId: { type: Schema.Types.ObjectId, ref: "Task" },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  calendarEventId: String,
  status: {
    type: String,
    enum: ["scheduled", "completed", "missed"],
    default: "scheduled",
  },
  googleEventId: { type: String }
}, { timestamps: true })

scheduleBlockSchema.index({ startTime: 1 })
scheduleBlockSchema.index({ taskId: 1 })

export const ScheduleBlockModel = model("ScheduleBlock", scheduleBlockSchema)
