import { Schema, model } from "mongoose";

const goalSchema = new Schema({
  title: { type: String, required: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  description: String,
  deadline: { type: Date, required: true },
  dailyAvailableMinutes: { type: Number, required: true, default: 240 },
  preferredFocusWindow: {
    type: String,
    enum: ["morning", "afternoon", "evening"],
  },
  status: {
    type: String,
    enum: ["active", "completed"],
    default: "active",
  },
}, { timestamps: true });

export const GoalModel = model("Goal", goalSchema);
