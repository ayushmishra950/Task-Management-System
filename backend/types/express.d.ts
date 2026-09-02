import mongoose from "express";

export interface IUser {
    id:mongoose.Types.ObjectId,
    role:string,
    companyId:mongoose.Types.ObjectId,
    sessionId:string,
};

declare global {
    namespace Express {
        interface Request {
            user?:IUser
        }
    }
}