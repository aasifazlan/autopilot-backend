import { Request, Response } from "express"
import { AuthService } from "./auth.service"

const authService = new AuthService()

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body
    const token = await authService.register(email, password, name)
    res.status(201).json({ token })
  } catch (error: any) {
    res.status(400).json({ message: error.message })
  }
}

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body
    const token = await authService.login(email, password)
    res.status(200).json({ token })
  } catch (error: any) {
    res.status(401).json({ message: error.message })
  }
}