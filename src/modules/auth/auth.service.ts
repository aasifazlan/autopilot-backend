import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import User from "../../infrastructure/database/user.model"

const JWT_SECRET = process.env.JWT_SECRET as string

export class AuthService {

  async register(email: string, password: string, name?: string) {
    const existing = await User.findOne({ email })
    if (existing) throw new Error("User already exists")

    const hashedPassword = await bcrypt.hash(password, 10)

    const trialExpiresAt = new Date()
    trialExpiresAt.setDate(trialExpiresAt.getDate() + 14)

    const user = await User.create({
      email,
      name,
      password: hashedPassword,
      provider: "local",
      isTrial: true,
      trialExpiresAt
    })

    return this.generateToken(user._id.toString())
  }

  async login(email: string, password: string) {
    const user: any = await User.findOne({ email })
    if (!user) throw new Error("Invalid credentials")

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) throw new Error("Invalid credentials")

    return this.generateToken(user._id.toString())
  }

  private generateToken(userId: string) {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" })
  }
}