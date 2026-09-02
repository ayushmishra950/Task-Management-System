import {Socket} from "socket.io";
import mongoose from "mongoose";


export interface ISocketUser{
    id:mongoose.Types.ObjectId,
    role:string,
    companyId:mongoose.Types.ObjectId | null,
    sessionId:string,
};


declare module "socket.io" {
    interface Socket {
        user?:ISocketUser
    }
}