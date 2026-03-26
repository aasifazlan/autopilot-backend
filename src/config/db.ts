import mongoose from "mongoose";


const connectDB= async ()=>{
    try {
        await mongoose.connect(process.env.MONGO_URI as string);
        console.log("MONGO connected");
    } catch (error) {
        console.log("Error connecting Mongo", error);
        process.exit(1);
    }
}

export default connectDB;