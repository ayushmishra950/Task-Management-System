import {Server as HttpServer} from "http";
import {Server, Socket} from "socket.io";
import env from "./env.ts";
import jwt from "jsonwebtoken";
import Session from "../models/session.model.ts";
import crypto from "crypto";
import {parse} from "cookie";
import type {Types} from "mongoose";

let io:Server | null = null;

interface ActiveUser {
    userId: string;
    role: string;
    companyId: Types.ObjectId | null;
    socketId: string;
}

export const activeUsers = new Map<string, ActiveUser>();   

export const initSocket = (server:HttpServer) => {
   io = new Server(server,{
    cors:{
        origin:[env.PRODUCTION_FRONTEND_URL],
        methods:["POST", "GET", "PUT", "PATCH", "DELETE"],
        credentials:true,
    }
   });

   io.use(async(socket:Socket, next) => {
       try{
        const cookies = parse(socket.handshake.headers.cookie || "");

         // Web browser cookies bhejta hai; mobile app websocket par cookies nahi bhej sakta,
         // isliye wo handshake.auth me token deta hai. Dono support karte hain.
         const accessToken = cookies.accessToken || socket.handshake.auth?.accessToken;

         if(!accessToken) return next(new Error("Authentication Error: Token missing."));
           
            let decoded:any;

            try{
                decoded = jwt.verify(accessToken, env.ACCESS_TOKEN_SECRET);

                const session = await Session.findOne({ 
                    _id: decoded.sessionId, 
                    isRevoked: false, 
                    expiresAt: { $gt: new Date() } 
                });
                if (!session) return next(new Error("Authentication Error: Session revoked."));

            }
           catch (jwtError: any) {
                if (jwtError?.name === "TokenExpiredError") {
                    const refreshToken = cookies.refreshToken || socket.handshake.auth?.refreshToken;
                    if (!refreshToken) return next(new Error("Authentication Error: Token Expired."));

                    const incomingHash = crypto.createHash("sha256").update(refreshToken).digest("hex");

                    const decodedRefresh: any = jwt.verify(refreshToken, env.REFRESH_TOKEN_SECRET);

                    const session = await Session.findOne({
                        _id: decodedRefresh.sessionId,
                        hashRefreshToken: incomingHash,
                        isRevoked: false,
                        expiresAt: { $gt: new Date() },
                    });

                    if (!session) return next(new Error("Authentication Error: Session Expired or revoked."));
               
                    decoded = decodedRefresh;
                } else {
                    return next(new Error("Authentication Error: Invalid AccessToken."));
                }
            }
  
            if(!decoded ||  !decoded?._id) return next(new Error("Authentication Error: Token payload is invalid."));
            
            socket.user = {
                  id:decoded?._id,
                  role:decoded?.role, 
                  companyId: decoded?.companyId?.toString() || null,
                  sessionId: decoded?.sessionId?.toString()
            }
           
        next();
       }
       catch(error:any){
        return next(new Error("Authentication error: Invalid Token"))
       }
   });


   io.on("connection",(socket:Socket) => {
       
       const user = socket.user;
       if(!user || !user.id || !user.role || !user.companyId) return;

       const userIdStr = user?.id?.toString();

      activeUsers.set(userIdStr, {
      userId: userIdStr,
      role: user.role,
      companyId: user.companyId,
      socketId: socket.id,
      });


       socket.join(userIdStr);
       console.log("🟢 Socket Client Connected", "UserId:", userIdStr, "role:", user?.role, "CompanyId:", user?.companyId);
       if (user.companyId) {
           socket.join(`company_${user.companyId}`);
       }


      socket.on("disconnect",(reason:string) => {
        const activeUser = activeUsers.get(userIdStr);

        // Sirf current socket hi active hai to remove karo
        if (activeUser?.socketId === socket.id) {
         activeUsers.delete(userIdStr);
        }

       console.log(`🔌 Client disconnected: ${userIdStr} due to ${reason}`);
      })
   })
   return io
};



export const getIO = () =>{
   if(!io){
    throw new Error("Socket.io has not been initialized! Call initSocket first.");
   }
   return io;
}
