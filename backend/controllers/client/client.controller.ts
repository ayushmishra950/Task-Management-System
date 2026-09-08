import User from "../../models/user.model.ts";
import Session from "../../models/session.model.ts";
import Project from "../../models/project.model.ts";
import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import bcrypt from "bcrypt";
import crypto from "crypto";
import mongoose from "mongoose";
import { generateAccessToken, generateRefreshToken } from "../../utils/jwt.util.ts";
import { loginClientValidationSchema, getClientByIdValidationSchema } from "../../schemas/client.schema.ts";

type LoginClientInput = z.infer<typeof loginClientValidationSchema>["body"];
type GetClientByIdParams = z.infer<typeof getClientByIdValidationSchema>["params"];

export const loginClient = async (req: Request<{}, {}, LoginClientInput>, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) return res.status(400).json({ success: false, message: "Missing required fields: email, password." });

    const user = await User.findOne({ email: email.toLowerCase().trim(), role: "client" }).select("+password");
    if (!user) return res.status(401).json({ success: false, message: "Invalid credentials or unauthorized client portal." });

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) return res.status(401).json({ success: false, message: "Invalid credentials." });

    if (user.status !== "ACTIVE") return res.status(403).json({ success: false, message: "Your client account is not active. Please contact the admin." });

    const sessionId = new mongoose.Types.ObjectId();

    const tokenPayload = {
      _id: user._id,
      role: user.role,
      companyId: user.companyId,
      sessionId: sessionId.toString(),
    };

    const accessToken = generateAccessToken(tokenPayload);
    const rawRefreshToken = generateRefreshToken(tokenPayload);

    const hashedRefreshToken = crypto.createHash("sha256").update(rawRefreshToken).digest("hex");

    const ipAddress = req.ip || req.headers["x-forwarded-for"]?.toString() || "Unknown";
    const deviceInfo = req.headers["user-agent"] || "Unknown";

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await Session.create({
      _id: sessionId,
      userId: user._id,
      hashRefreshToken: hashedRefreshToken,
      isRevoked: false,
      deviceInfo,
      ipAddress,
      expiresAt,
      companyId: user.companyId,
      role: user.role,
    });

    const isProduction = process.env.NODE_ENV === "production";

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "strict" : "lax",
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("refreshToken", rawRefreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "strict" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      data: { user: { id: user._id, role: user.role, companyId: user.companyId } },
    });
  } catch (error: any) {
    console.error("Login Client Fatal Error:-", error?.message);
    return next(error);
  }
};

export const logoutClient = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sessionId = req.user?.sessionId;

    if (!sessionId) return res.status(401).json({ success: false, message: "Unauthorized: No active session found." });

    await Session.findByIdAndDelete(sessionId);

    const isProduction = process.env.NODE_ENV === "production";

    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? ("strict" as const) : ("lax" as const),
      path: "/",
    };

    res.clearCookie("accessToken", cookieOptions);
    res.clearCookie("refreshToken", cookieOptions);

    return res.status(200).json({ success: true, message: "Logged out successfully. Session destroyed." });
  } catch (error: any) {
    console.error("Logout Client Fatal Error:-", error?.message);
    return next(error);
  }
};

export const getClientProfileById = async (req: Request<GetClientByIdParams, {}, {}>, res: Response, next: NextFunction) => {
  try {
    if (req.params.id !== req.user?.id?.toString()) {
      return res.status(403).json({ success: false, message: "Access Denied: You can only view your own profile." });
    }

    const client = await User.findOne({ _id: req.params.id, companyId: req.params.companyId, role: "client" }).select("-password");
    if (!client) return res.status(404).json({ success: false, message: "Client Not Found." });

    return res.status(200).json({ success: true, data: client });
  } catch (error: any) {
    console.log("Client Profile Get Error:-", error?.message);
    next(error);
  }
};

/** Client sirf apne hi projects dekh sakta hai (read-only). */
export const getMyProjects = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projects = await Project.find({ companyId: req.user?.companyId, clientId: req.user?.id }).sort({ createdAt: -1 });

    return res.status(200).json({ success: true, data: projects });
  } catch (error: any) {
    console.log("Client Projects Get Error:-", error?.message);
    next(error);
  }
};
