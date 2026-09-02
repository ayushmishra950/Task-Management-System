
import Admin from "../../models/user.model.ts";
import type {Request, Response, NextFunction} from "express";
import { adminValidationSchema,updateAdminStatusValidationSchema, updateAdminValidationSchema, getAdminByIdValidationSchema, loginAdminValidationSchema } from "../../schemas/admin.schema.ts";
import {z} from "zod";


type AdminInput = z.infer<typeof adminValidationSchema>["body"];
type UpdateAdminParams = z.infer<typeof updateAdminValidationSchema>["params"];
type UpdateAdminInput = z.infer<typeof updateAdminValidationSchema>["body"];
type UpdateAdminStatusInput = z.infer<typeof updateAdminStatusValidationSchema>["body"];
type UpdateAdminStatusParams = z.infer<typeof updateAdminStatusValidationSchema>["params"];
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


export const getAllAdmins = async(req:Request,res:Response,next:NextFunction) => {
  try{
       const admin = await Admin.find({role:"admin"});
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
       const id = req.params.id;
       const admin = await Admin.findByIdAndUpdate(id, {$set:req.body}, {new:true, runValidators:true});
        if(!admin)return res.status(404).json({message:"Admin Not Found.", success:false})
       res.status(200).json({success:true,data:admin, message:"Admin Updated Successfully."})
  }
  catch(error:any){
    console.log("Update Admin Error:-", error?.message);
    next(error);
  }
};





export const updateAdminStatus = async(req:Request<UpdateAdminStatusParams, {}, UpdateAdminStatusInput>, res:Response, next:NextFunction) => {
  try{ 
       const admin = await Admin.findOneAndUpdate({_id:req.params.id, companyId:req.params.companyId}, {$set:{active:req.body.status}}, {new:true, runValidators:true});
        if(!admin)return res.status(404).json({message:"Admin Not Found.", success:false})
       res.status(200).json({success:true,data:admin, message:"Admin Updated Successfully."})
  }
  catch(error:any){
    console.log("Update Admin Error:-", error?.message);
    next(error);
  }
};

