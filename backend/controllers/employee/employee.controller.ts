import User from "../../models/user.model.ts";
import type {Request, Response, NextFunction} from "express";
import { loginEmployeeValidationSchema } from "../../schemas/user.schema.ts";
import {z} from "zod";
import { generateAccessToken, generateRefreshToken } from "../../utils/jwt.util.ts";
import Session from "../../models/session.model.ts";
import bcrypt from "bcrypt";
import crypto from "crypto";
import mongoose from "mongoose";
import {getEmployeeByIdValidationSchema} from "../../schemas/user.schema.ts";


type LoginEmployeeInput = z.infer<typeof loginEmployeeValidationSchema>["body"];
type GetEmployeeByIdParams = z.infer<typeof getEmployeeByIdValidationSchema>["params"];



export const loginEmployee = async (req: Request<{},{}, LoginEmployeeInput>, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) return res.status(400).json({ success: false, message: "Missing required fields: email, password."});

    const user = await User.findOne({email: email.toLowerCase().trim()}).select("+password");

    if (!user) return res.status(401).json({success: false, message: "Invalid credentials or unauthorized company portal."});

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) return res.status(401).json({ success: false, message: "Invalid credentials."});
 
    const sessionId = new mongoose.Types.ObjectId();

    const tokenPayload = {
        _id: user._id,
        role: user.role,
        companyId: user.companyId,
        sessionId: sessionId.toString()
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
        role:user.role,
    });

    const isProduction = process.env.NODE_ENV === "production";
    
    res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "strict" : "lax",
        maxAge: 15 * 60 * 1000 
    });

    res.cookie("refreshToken", rawRefreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "strict" : "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000 
    });

    return res.status(200).json({ success: true, message: "Login successful.",
        data: {
            user: {
                id: user._id,
                role: user.role,
                companyId: user.companyId
            }}});

  } catch (error: any) {
    console.error("Login Admin Fatal Error:-", error?.message);
    return next(error);
  }
};

export const logoutEmployee = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sessionId = req.user?.sessionId;

    if (!sessionId) return res.status(401).json({ success: false, message: "Unauthorized: No active session found." });

    await Session.findByIdAndDelete(sessionId);

    const isProduction = process.env.NODE_ENV === "production";
    
    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? ("strict" as const) : ("lax" as const),
      path: "/"
    };

    res.clearCookie("accessToken", cookieOptions);
    res.clearCookie("refreshToken", cookieOptions);

    return res.status(200).json({success: true,message: "Logged out successfully. Session destroyed."});

  } catch (error: any) {
    console.error("Logout Admin Fatal Error:-", error?.message);
    return next(error);
  }
};





export const getEmployeeById = async(req:Request<GetEmployeeByIdParams, {}, {}>, res:Response, next:NextFunction) => {
  try{
     const employee = await User.findOne({_id:req.params.id, companyId:req.params.companyId as string}).populate("department", "name").populate("managedDepartments", "name");
     if(!employee)return res.status(404).json({message:"Employee Not Found.", success:false})

        res.status(200).json({success:true, data:employee});
    }
  catch(error:any){
    console.log("Employee Get Error:-", error?.message);
    next(error);
  }
};