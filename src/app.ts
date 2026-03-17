import express from "express";
import authRoute from "./modules/auth/auth.routes"
import taskRoute from "./modules/task/task.routes"
import schedulingRoutes from "./modules/scheduling/scheduling.routes"
import calendarRoutes from "./modules/calendar/calendar.routes"
import aiRoutes from "./modules/ai/ai.routes"
import goalRoutes from "./modules/goal/goal.routes"

const app=express();

app.use(express.json());

app.use("/api/auth", authRoute)
app.use("/api/task", taskRoute)
app.use("/api/schedule", schedulingRoutes)
app.use("/api/calendar", calendarRoutes)
app.use("/api/ai", aiRoutes)
app.use("/api/goals", goalRoutes)

export default app;