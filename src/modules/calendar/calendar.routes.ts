import { Router } from "express"
import { authMiddleware } from "../../middleware/auth.middleware"
import {
  connectGoogle,
  googleCallback
} from "./calendar.controller"

const router = Router()

router.get("/google/connect", authMiddleware, connectGoogle)

router.get("/google/callback", googleCallback)

export default router