import Department from "../../models/department.model.ts";
import type { Request,Response, NextFunction } from "express";
import {departmentValidationSchema, updateDepartmentValidationSchema,getDepartmentValidationSchema, deleteDepartmentValidationSchema,} from "../../schemas/department.schema.ts";
import {z} from "zod";

type DepartmentInput = z.infer<typeof departmentValidationSchema>["body"];
type UpdateDepartmentInput = z.infer<typeof updateDepartmentValidationSchema>["body"];
type UpdateDepartmentParams = z.infer<typeof updateDepartmentValidationSchema>["params"];
type GetDepartmentParams = z.infer<typeof getDepartmentValidationSchema>["params"];
type DeleteDepartmentParams = z.infer<typeof deleteDepartmentValidationSchema>["params"];

export const createDepartment = async(req:Request<{}, {},DepartmentInput>, res:Response, next:NextFunction) => {
    try{
         const {name, description, ...restBody } = req.body;
         const departmentData:any = {
            name:name, 
            ...restBody,
            ...description && {description},
         }
        const department = await Department.create(departmentData);
        if(!department) return res.status(404).json({success:false, message:"Department Create Failed."});

        res.status(201).json({success:true, message:`${name} is create successfully.`})
    }
    catch(error:any){
        console.log("Department Create Error:-", error?.message);
        next(error);
    }
};


export const getDepartment = async(req:Request<GetDepartmentParams, {}, {}>, res:Response, next:NextFunction) => {
    try{
        const department = await Department.find({companyId:req.params.companyId});
        if(!department?.length) return res.status(404).json({success:false, message:"Department Not Found."});

        res.status(200).json({success:true, data:department})
    }
    catch(error:any){
        console.log("Department Get Error:-", error?.message);
        next(error);
    }
};



export const updateDepartment = async(req:Request<UpdateDepartmentParams, {}, UpdateDepartmentInput>, res:Response, next:NextFunction) => {
    try{
        const department = await Department.findOneAndUpdate({_id:req.params.id, companyId:req.params.companyId}, {$set: req.body},{returnDocument:"after", runValidators:true});
        if(!department) return res.status(404).json({success:false, message:"Department Not Found."});

        res.status(200).json({success:true, message:`${department?.name} is updated successfully.`, data:department})
    }
    catch(error:any){
        console.log("Department Update Error:-", error?.message);
        next(error);
    }
};


export const deleteDepartment = async(req:Request<DeleteDepartmentParams, {}, {}>, res:Response, next:NextFunction) => {
    try{
        const department = await Department.deleteOne({_id:req.params.id, companyId:req.params.companyId});
        if(!department) return res.status(404).json({success:false, message:"Department Not Found."});

        res.status(200).json({success:true, message:`Department Delete successfully.`})
    }
    catch(error:any){
        console.log("Department Delete Error:-", error?.message);
        next(error);
    }
};