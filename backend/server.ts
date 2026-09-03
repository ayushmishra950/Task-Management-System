import app from "./app.ts";
import {connectDB} from "./config/db.ts";
import http from "http";
import env from "./config/env.ts";
import {initSocket} from "./config/socketInit.ts";

const server = http.createServer(app);


  initSocket(server);


const startServer = async () => {
    try {
        await connectDB(); 
        console.log("✅ Database connected successfully.");

        server.listen(env.PORT, () => {
        console.log(`🚀 Server is listening on PORT ${env.PORT}`);
        });

    } catch (error) {
        console.error("❌ Failed to start server due to DB connection error:", error);
        process.exit(1);
    }
};

startServer();


process.on("uncaughtException", (err) => {
    console.error("💥 UNCAUGHT EXCEPTION! Shutting down...", err.name, err.message);
    process.exit(1); 
});

process.on("unhandledRejection", (err: any) => {
    console.error("💥 UNHANDLED REJECTION! Shutting down safely...", err?.name, err?.message);
    server.close(() => {
        process.exit(1);
    });
});

