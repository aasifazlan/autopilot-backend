import { Router } from "express"
import { authMiddleware } from "../../middleware/auth.middleware"
import {
  createTask,
  getTasks,
  updateTask,
  deleteTask
} from "./task.controller"

const router = Router()

 


router.use(authMiddleware) // 🔐 Protect all task routes

router.post("/", createTask)
router.get("/", getTasks)
router.patch("/:id", updateTask)
router.delete("/:id", deleteTask)

export default router