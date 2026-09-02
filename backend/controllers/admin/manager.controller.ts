import User from "../../models/user.model.ts";
import type { Request, Response, NextFunction } from "express";
import {managerValidationSchema, updateManagerValidationSchema, getManagerValidationSchema} from "../../schemas/manager.schema.ts";
import {z} from "zod";

type ManagerParams = z.infer<typeof managerValidationSchema>["params"];
type UpdateManagerParams = z.infer<typeof updateManagerValidationSchema>["params"];
type GetManagerParams = z.infer<typeof getManagerValidationSchema>["params"];


export const createManager = async(req:Request<ManagerParams,{}, {}>, res:Response, next:NextFunction) => {
    try{
       const manager = await User.findOne({_id:req.params.id, companyId:req.params.companyId});
       if(!manager) return res.status(404).json({message:"Manager Create Failed.", success:false});
        
       const isAlreadyManager = manager?.managedDepartments?.some((id) => id?.toString() === req.params.departmentId);
          if(isAlreadyManager) return res.status(409).json({success:false, message:"This user is already a manager of this department."})

       const updateManager = await User.findOneAndUpdate({_id:req.params.id, companyId:req.params.companyId}, {$addToSet:{managedDepartments:req.params.departmentId}, $set:{role:"manager"}}, {new:true, runValidators:true})
       res.status(201).json({message:"Manager created successfully.", success:true, data:updateManager});
    }
    catch(error:any){
        console.log("Create Manager Error:-", error?.message);
        next(error);
    }
};


export const getManager = async(req:Request<GetManagerParams,{}, {}>, res:Response, next:NextFunction) => {
    try{
       const manager = await User.find({ companyId:req.params.companyId,role:"manager", managedDepartments:{$exists:true, $not:{$size:0}}}, {managedDepartments:1, fullName:1, email:1, contact:1, role:1}).populate("managedDepartments", "name").populate("department", "name");
       if(!manager?.length) return res.status(404).json({message:"Manager Not Found.", success:false});

       res.status(200).json({success:true, data:manager});
    }
    catch(error:any){
        console.log("Get Manager Error:-", error?.message);
        next(error);
    }
};


export const deleteManager = async(req:Request<ManagerParams, {}, {}>, res:Response, next:NextFunction) => {
    try{
       const manager = await User.findOneAndUpdate({_id:req.params.id, companyId:req.params.companyId, role:"manager"},{$pull:{managedDepartments:req.params.departmentId}}, {new:true, runValidators:true})
       if(!manager) return res.status(404).json({message:"Manager Not Found.", success:false});
    
       if (manager?.managedDepartments && manager.managedDepartments.length === 0) {
    manager.role = "employee";
    await manager.save();
}

       res.status(200).json({message:"Manager Deleted successfully.", success:true});
    }
    catch(error:any){
        console.log("Delete Manager Error:-", error?.message);
        next(error);
    }
};



export const updateManager = async(req:Request<UpdateManagerParams,{},{}>, res:Response, next:NextFunction) => {
    try{
       if(req.params.oldDepartmentId === req.params.newDepartmentId) {
           return res.status(400).json({message:"Please select a different department.", success:false});
       }

       const manager = await User.findOneAndUpdate({_id:req.params.id, companyId:req.params.companyId, role:"manager"}, {$pull:{managedDepartments:req.params.oldDepartmentId}, $addToSet:{managedDepartments:req.params.newDepartmentId}},{new:true, runValidators:true})
       if(!manager) return res.status(404).json({message:"Manager Not Found.", success:false});

       res.status(200).json({message:"Manager Updated successfully.", success:true, data:manager});
    }
    catch(error:any){
        console.log("Update Manager Error:-", error?.message);
        next(error);
    }
};


