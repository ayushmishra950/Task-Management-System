
import type {Request, Response, NextFunction} from "express";
import { generateAccessToken, generateRefreshToken } from "../../utils/jwt.util.ts";
import Session from "../../models/session.model.ts";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import env from "../../config/env.ts";
import User from "../../models/user.model.ts";
import SuperAdmin from "../../models/superAdmin.model.ts";
import {fullUnionSchema} from "../../schemas/password.schema.ts";
import {z} from "zod";
import { Types } from "mongoose";


type UserInput = z.infer<typeof fullUnionSchema>["body"];
type UserParams = z.infer<typeof fullUnionSchema>["params"];



export const refreshSessionToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currentRefreshToken = req.cookies?.refreshToken || req.headers["x-refresh-token"]?.toString();

    if (!currentRefreshToken) return res.status(401).json({ success: false, message: "Refresh token is missing." });

    let decoded: any;
    try {
      decoded = jwt.verify(currentRefreshToken, env.REFRESH_TOKEN_SECRET);
    } catch (jwtError) {
      return res.status(401).json({ success: false, message: "Invalid or expired refresh token. Please login again." });
    }

    const incomingHash = crypto.createHash("sha256").update(currentRefreshToken).digest("hex");

    const session = await Session.findOne({
      _id: decoded.sessionId,
      hashRefreshToken: incomingHash,
      isRevoked: false,
      expiresAt: { $gt: new Date() } 
    });

    if (!session) {
      await Session.deleteMany({ userId: decoded._id });
      
      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");
      
      return res.status(403).json({ success: false, message: "Security Alert: Token reuse detected. All sessions revoked. Please re-authenticate."});
    }

    const tokenPayload = {
      _id: decoded._id,
      role: decoded.role,
      companyId: decoded.companyId,
      sessionId: decoded.sessionId 
    };

    const newAccessToken = generateAccessToken(tokenPayload);
    const newRefreshToken = generateRefreshToken(tokenPayload);

    const newHashedRefreshToken = crypto.createHash("sha256").update(newRefreshToken).digest("hex");
    
    session.hashRefreshToken = newHashedRefreshToken;
    session.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); 
    await session.save();

    const isProduction = process.env.NODE_ENV === "production";

    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "strict" : "lax",
      maxAge: 15 * 60 * 1000
    });

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "strict" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000 
    });

    // Mobile app ke liye naye tokens body me bhi chahiye
    return res.status(200).json({ success: true, message: "Tokens refreshed successfully.",
      data: { tokens: { accessToken: newAccessToken, refreshToken: newRefreshToken } }});

  } catch (error: any) {
    console.error("Refresh Token Fatal Error:-", error?.message);
    return next(error);
  }
};



export const updatePassword = async (req: Request<UserParams, {}, UserInput>, res: Response, next: NextFunction) => {
  try {
    const {id} = req.params;
    const {role, password} = req.body;

    let user;

    if (role === "super_admin") {
      user = await SuperAdmin.findById(id);
    } else {
      const {companyId} = req.params as any;
      user = await User.findOne({_id:id, companyId:new Types.ObjectId(companyId)});
    }

    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    user.password = password;

    await user.save();

    return res.status(200).json({success: true, message: "Password updated successfully"});

  } catch (error: any) {
    console.error("Refresh Token Fatal Error:-", error?.message);
    return next(error);
  }
};
