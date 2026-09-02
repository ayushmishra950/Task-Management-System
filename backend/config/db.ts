import mongoose from "mongoose";
import env from "./env.ts";

export const connectDB = async (): Promise<void> => {
    try {
        await mongoose.connect(env.MONGO_URI);
        console.log(`Database connected successfully on port ${env.PORT}! 🎉`);
    } catch (error: any) {
        console.error("Database connection Failed:-", error?.message);
        process.exit(1);
    }
};
