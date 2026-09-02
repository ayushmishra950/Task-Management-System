import SuperAdmin from "../../models/superAdmin.model.ts";
import type {Request, Response, NextFunction} from "express";
import { superAdminValidationSchema, updateSuperAdminValidationSchema,getSuperAdminValidationSchema, loginSuperAdminValidationSchema } from "../../schemas/superAdmin.schema.ts";
import {z} from "zod";
import { generateAccessToken, generateRefreshToken } from "../../utils/jwt.util.ts";
import bcrypt from "bcrypt";
import crypto from "crypto";
import mongoose from "mongoose";
import Session from "../../models/session.model.ts";

type SuperAdminInput = z.infer<typeof superAdminValidationSchema>["body"];
type LoginSuperAdminInput = z.infer<typeof loginSuperAdminValidationSchema>["body"];
type UpdateSuperAdminParams = z.infer<typeof updateSuperAdminValidationSchema>["params"];
type UpdateSuperAdminInput = z.infer<typeof updateSuperAdminValidationSchema>["body"];
type GetSuperAdminParams = z.infer<typeof getSuperAdminValidationSchema>["params"];


export const registerSuperAdmin = async(req:Request<{}, {}, SuperAdminInput>, res:Response, next:NextFunction) => {
  try{
         const {fullName} = req.body;
        const superAdmin = await SuperAdmin.create(req.body);
       if(!superAdmin)return res.status(404).json({success:false, message:"Super Admin Not Found."})

         res.status(201).json({success:true, message:`${fullName} is Registered Successfully.`})
  }
  catch(error:any){
    console.log("register Super Admin Error:-", error?.message);
    next(error);
  }
};



export const loginSuperAdmin = async (req: Request<{},{}, LoginSuperAdminInput>, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) return res.status(400).json({ success: false, message: "Missing required fields: email, password."});

    const user = await SuperAdmin.findOne({email: email.toLowerCase().trim()}).select("+password");

    if (!user) return res.status(401).json({success: false, message: "Invalid credentials or unauthorized company portal."});

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) return res.status(401).json({ success: false, message: "Invalid credentials."});
 
    const sessionId = new mongoose.Types.ObjectId();

    const tokenPayload = {
        _id: user._id,
        role: user.role,
        companyId:  null,
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
        companyId: null,
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

    return res.status(200).json({ success: true, message: "Login successfully.",
        data: {
            user: {
                id: user._id,
                role: user.role,
            }}});

  } catch (error: any) {
    console.error("Login Admin Fatal Error:-", error?.message);
    return next(error);
  }
};

export const logoutSuperAdmin = async (req: Request, res: Response, next: NextFunction) => {
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



export const getSuperAdmin = async(req:Request<GetSuperAdminParams,{}, {}>,res:Response,next:NextFunction) => {
  try{
      console.log("getAdmin", req.params.id)
       const superAdmin = await SuperAdmin.findById(req.params.id);
             if(!superAdmin)return res.status(404).json({success:false, message:"Super Admin Not Found."})

       res.status(200).json({success:true, data:superAdmin});
  }
  catch(error:any){
    console.log("get Super Admin Error:-", error?.message);
    next(error);
  }
};

export const deleteSuperAdmin = async(req:Request<GetSuperAdminParams, {}, {}>, res:Response, next:NextFunction) => {
  try{
      const superAdmin = await SuperAdmin.findByIdAndDelete(req.params.id);
      if(!superAdmin)return res.status(404).json({success:false, message:"Super Admin Not Found."})
     
      res.status(200).json({message:`Your Account Deleted Successfully.`, success:true})
  }
  catch(error:any){
    console.log("Delete Super Admin Error:-", error?.message);
    next(error);
  }
};


export const updateSuperAdmin = async(req:Request<UpdateSuperAdminParams, {}, UpdateSuperAdminInput>, res:Response, next:NextFunction) => {
  try{
       const id = req.params.id;
       const superAdmin = await SuperAdmin.findByIdAndUpdate(id, {$set:req.body}, {new:true, runValidators:true});
        if(!superAdmin)return res.status(404).json({message:"Super Admin Not Found.", success:false})
       res.status(200).json({success:true,data:superAdmin, message:"Super Admin Updated Successfully."})
  }
  catch(error:any){
    console.log("Update Super Admin Error:-", error?.message);
    next(error);
  }
}