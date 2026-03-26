import { Router } from "express"
import { authMiddleware } from "../../middleware/auth.middleware"
import {
  connectGoogle,
  googleCallback
} from "./calendar.controller"

const router = Router()

router.get("/google/connect",  connectGoogle)//authMiddleware,

router.get("/google/callback", googleCallback)

export default router