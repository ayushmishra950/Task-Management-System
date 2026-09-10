import Admin from "../../models/user.model.ts";
import type {Request, Response, NextFunction} from "express";
import { adminValidationSchema, updateAdminValidationSchema, getAdminByIdValidationSchema, loginAdminValidationSchema } from "../../schemas/admin.schema.ts";
import {z} from "zod";
import { generateAccessToken, generateRefreshToken } from "../../utils/jwt.util.ts";
import Session from "../../models/session.model.ts";
import bcrypt from "bcrypt";
import crypto from "crypto";
import mongoose from "mongoose";

type AdminInput = z.infer<typeof adminValidationSchema>["body"];
type LoginAdminInput = z.infer<typeof loginAdminValidationSchema>["body"];
type UpdateAdminParams = z.infer<typeof updateAdminValidationSchema>["params"];
type UpdateAdminInput = z.infer<typeof updateAdminValidationSchema>["body"];
type GetAdminByIdParams = z.infer<typeof getAdminByIdValidationSchema>["params"];


export const registerAdmin = async(req:Request<{}, {}, AdminInput>, res:Response, next:NextFunction) => {
  try{
         const {fullName, profileImage, ...restBody} = req.body;
         const adminData:any = {
            ...restBody,
            fullName,
            ...(profileImage && {profileImage}),
         }
        const admin = await Admin.create(adminData);
       if(!admin)return res.status(404).json({success:false, message:"Admin Not Found."});

         res.status(201).json({success:true, message:`${fullName} is Registered Successfully.`});
  }
  catch(error:any){
    console.log("register Admin Error:-", error?.message);
    next(error);
  }
};



export const loginAdmin = async (req: Request<{},{}, LoginAdminInput>, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) return res.status(400).json({ success: false, message: "Missing required fields: email, password."});

    const user = await Admin.findOne({email: email.toLowerCase().trim()}).select("+password");

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
            },
            // Mobile app cookies use nahi kar sakta, isliye tokens body me bhi bhejte hain.
            // Web client in fields ko ignore karta hai aur cookies se hi chalta rehta hai.
            tokens: {
                accessToken,
                refreshToken: rawRefreshToken
            }}});

  } catch (error: any) {
    console.error("Login Admin Fatal Error:-", error?.message);
    return next(error);
  }
};

export const logoutAdmin = async (req: Request, res: Response, next: NextFunction) => {
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


export const getAdminById = async(req:Request<GetAdminByIdParams,{}, {}>,res:Response,next:NextFunction) => {
  try{
       const admin = await Admin.findById(req.params.id);
             if(!admin)return res.status(404).json({success:false, message:"Admin Not Found."})

       res.status(200).json({success:true, data:admin});
  }
  catch(error:any){
    console.log("get Admin Error:-", error?.message);
    next(error);
  }
};

export const deleteAdmin = async(req:Request<GetAdminByIdParams, {}, {}>, res:Response, next:NextFunction) => {
  try{
      const admin = await Admin.findByIdAndDelete(req.params.id);
      if(!admin)return res.status(404).json({success:false, message:"Admin Not Found."})
     
      res.status(200).json({message:`Your Account Deleted Successfully.`, success:true})
  }
  catch(error:any){
    console.log("Delete Admin Error:-", error?.message);
    next(error);
  }
};


export const updateAdmin = async(req:Request<UpdateAdminParams, {}, UpdateAdminInput>, res:Response, next:NextFunction) => {
  try{
       const admin = await Admin.findOneAndUpdate({_id:req.params.id, companyId:req.params.companyId}, {$set:req.body}, {new:true, runValidators:true});
        if(!admin)return res.status(404).json({message:"Admin Not Found.", success:false})
       res.status(200).json({success:true,data:admin, message:"Admin Updated Successfully."})
  }
  catch(error:any){
    console.log("Update Admin Error:-", error?.message);
    next(error);
  }
}