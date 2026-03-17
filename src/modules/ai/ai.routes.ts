import { Router } from "express"
import { authMiddleware } from "../../middleware/auth.middleware"
import { generatePlan } from "./ai.controller"

const router = Router()

router.post("/plan", authMiddleware, generatePlan)

export default router