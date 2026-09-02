import Company from "../../models/company.model.ts";
import type { Request, Response, NextFunction } from "express";
import {companyValidationSchema, updateCompanyValidationSchema, getByIdCompanyValidationSchema} from "../../schemas/company.schema.ts";
 
import {z} from "zod";


type CompanyInput = z.infer<typeof companyValidationSchema>["body"];
type UpdateCompanyInput = z.infer<typeof updateCompanyValidationSchema>["body"];
type UpdateCompanyParams = z.infer<typeof updateCompanyValidationSchema>["params"];
type GetByIdCompanyParams = z.infer<typeof getByIdCompanyValidationSchema>["params"];


export const createCompany = async(req:Request<{}, {}, CompanyInput>, res:Response, next:NextFunction) => {
  try{
       const {logo, ...restBody} = req.body;
       const companyData = {...restBody, ...logo && {logo}};
       
      const company = await Company.create(companyData);
      if(!company) return res.status(404).json({success:false, message:"Company Create Failed."})
   
        res.status(201).json({success:true, message:"Company Created Successfully.", data:company})
    }
  catch(error:any){
    console.log("Company Create Error:-", error?.message);
    next(error);
  }
};


export const getCompany = async(req:Request, res:Response, next:NextFunction) => {
  try{
      const company = await Company.find();
      if(!company?.length) return res.status(404).json({success:false, message:"Company Not Found."})
   
        res.status(200).json({success:true, data:company})
    }
  catch(error:any){
    console.log("Company Get Error:-", error?.message);
    next(error);
  }
};


export const getByIdCompany = async(req:Request<GetByIdCompanyParams, {}, {}>, res:Response, next:NextFunction) => {
  try{
      const company = await Company.findById(req.params.id);
      if(!company) return res.status(404).json({success:false, message:"Company Not Found."})
   
        res.status(200).json({success:true, data:company})
    }
  catch(error:any){
    console.log("Company Get Error:-", error?.message);
    next(error);
  }
};


export const deleteCompany = async(req:Request<GetByIdCompanyParams,{}, {}>, res:Response, next:NextFunction) => {
  try{
      const company = await Company.findByIdAndDelete(req.params.id);
      if(!company) return res.status(404).json({success:false, message:"Company Not Found."})
   
        res.status(200).json({success:true, message:"Company Deleted Successfully.", data:company})
    }
  catch(error:any){
    console.log("Company Delete Error:-", error?.message);
    next(error);
  }
};



export const updateCompany = async(req:Request<UpdateCompanyParams, {}, UpdateCompanyInput>, res:Response, next:NextFunction) => {
  try{
      const company = await Company.findOneAndUpdate({_id:req.params.id},{$set:req.body}, {new:true, runValidators:true});
      if(!company) return res.status(404).json({success:false, message:"Company Not Found."})
   
        res.status(200).json({success:true, message:"Company Updated Successfully.", data:company})
    }
  catch(error:any){
    console.log("Company Update Error:-", error?.message);
    next(error);
  }
};