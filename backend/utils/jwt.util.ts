import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import env from "../config/env.ts";

interface BasePayload {
    _id: mongoose.Types.ObjectId | string;
    sessionId: string;
}

interface SuperAdminPayload extends BasePayload {
    role: 'super_admin';
    companyId?: mongoose.Types.ObjectId | string | null; 
}

interface OtherRolesPayload extends BasePayload {
    role: Exclude<string, 'super_admin'>;
    companyId: mongoose.Types.ObjectId | string; 
}

export type TokenPayload = SuperAdminPayload | OtherRolesPayload;


export const generateAccessToken = (payload: TokenPayload): string => {
    return jwt.sign(payload, env.ACCESS_TOKEN_SECRET, {
        expiresIn: env.ACCESS_TOKEN_SECRET_EXPIRE as any
    });
};


export const generateRefreshToken = (payload: TokenPayload): string => {
    return jwt.sign(payload, env.REFRESH_TOKEN_SECRET, {
        expiresIn: env.REFRESH_TOKEN_SECRET_EXPIRE as any 
    });
};
