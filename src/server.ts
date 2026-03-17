import dotenv from "dotenv"
dotenv.config();
import connectDB from "./config/db"
import app from "./app"
import { startNightlyPlanner } from "./jobs/nightlyPlanner.job";
import { startRescheduler } from "./jobs/rescheduler.job";


 app.get("/health", (req,res)=>{
    res.send("its working")
  })

const PORT=process.env.PORT || 5000

async function start() {
  connectDB()
  startNightlyPlanner()
  startRescheduler()

  app.listen(PORT, () => {
    console.log("Server running on port 5000")
  })
}

start()
