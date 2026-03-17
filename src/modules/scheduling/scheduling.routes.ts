import { Router } from "express"
import { authMiddleware } from "../../middleware/auth.middleware"
import { getSchedule, runScheduler } from "./scheduling.controller"

const router = Router()

router.use(authMiddleware)

router.post("/run", runScheduler)
router.get("/", getSchedule)

export default router