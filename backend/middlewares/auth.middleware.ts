import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import env from "../config/env.ts";
import Session from "../models/session.model.ts";
import { generateAccessToken } from "../utils/jwt.util.ts"; 

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const accessToken = req.headers.authorization?.split(" ")[1] || req.cookies?.accessToken;
        
        if (!accessToken) return res.status(401).json({ message: "Token is missing.", success: false });

        let decoded: any;

        try {
            decoded = jwt.verify(accessToken, env.ACCESS_TOKEN_SECRET);
        } 
        catch (jwtError: any) {
            if (jwtError?.name === "TokenExpiredError") {
                const refreshToken = req.headers["x-refresh-token"]?.toString() || req.cookies?.refreshToken;

                if (!refreshToken) return res.status(401).json({ success: false, message: "Refresh Token missing." });
                try {
                    const decodedRefresh: any = jwt.verify(refreshToken, env.REFRESH_TOKEN_SECRET);
                    
                    const incomingHash = crypto.createHash("sha256").update(refreshToken).digest("hex");

                    const session = await Session.findOne({ _id: decodedRefresh.sessionId, hashRefreshToken: incomingHash, isRevoked: false,expiresAt: { $gt: new Date() },
                    }).catch(() => null);

                    if (!session) return res.status(401).json({ success: false, message: "Session expired or revoked. Please login again." });

                    const newAccessToken = generateAccessToken({
                        _id: decodedRefresh._id,
                        role: decodedRefresh.role,
                        companyId: decodedRefresh.companyId,
                        sessionId: decodedRefresh.sessionId
                    });

                    res.cookie("accessToken", newAccessToken, {
                        httpOnly: true,
                        secure: process.env.NODE_ENV === "production",
                        sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
                        maxAge: 15 * 60 * 1000
                    });

                    decoded = decodedRefresh;
                } catch (refreshError) {
                    return res.status(401).json({ success: false, message: "Invalid or expired Refresh Token." });
                }
            } else {
                return res.status(401).json({ success: false, message: "Authentication Error: Invalid AccessToken." });
            }
        }

        if (!decoded || !decoded?._id) return res.status(401).json({ success: false, message: "Authentication Error: Token payload is invalid." });

        req.user = {
            id: decoded?._id,
            role: decoded?.role,
            companyId: decoded?.companyId,
            sessionId: decoded?.sessionId 
        };

        next();
    } catch (error: any) {
        console.log("Authentication Failed:-", error?.message);
        next(error);
    }
};
