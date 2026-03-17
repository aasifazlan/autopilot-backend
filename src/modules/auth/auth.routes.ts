import { Router } from "express"
import { register, login } from "./auth.controller"
 

const router = Router()

router.post("/register", register)
router.post("/login", login)
router.get("/test", (req, res)=>{
    res.send("hey its working fine");
})

export default router