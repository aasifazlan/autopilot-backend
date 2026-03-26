import mongoose, { Schema, Document } from "mongoose"

export interface IUser extends Document {
  email: string
  name?: string
  provider: "local" | "google" | "apple"
  isTrial: boolean
  trialExpiresAt?: Date
  password: string,
  // Google OAuth fields
  googleTokens?: {
    googleAccessToken?: string
    googleRefreshToken?: string
    googleTokenExpiry?: Date
  }
   
}

const UserSchema = new Schema(
  {
    email: { type: String, required: true, unique: true },
    name: { type: String },
    provider: {
      type: String,
      enum: ["local", "google", "apple"],
      default: "local"
    },
    isTrial: { type: Boolean, default: true },
    trialExpiresAt: { type: Date },
    password: {type:String, required: function(){
      return this.provider === "local"
    }},
     
    googleTokens:{
      type: Schema.Types.Mixed
    }
  },
  { timestamps: true }
)

export default mongoose.model<IUser>("User", UserSchema)