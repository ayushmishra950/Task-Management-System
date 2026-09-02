import Project from "../../models/project.model.ts";
import type { Request, Response, NextFunction } from "express";
import {projectValidationSchema,deleteProjectByIdValidationSchema,updateProjectStatusValidationSchema, updateProjectValidationSchema, getProjectValidationSchema, getProjectByIdValidationSchema} from "../../schemas/project.schema.ts";
import {z} from "zod";
import {reassignmentHistory, completedStatusAssignment, getProjectByIdData,handleGetDashboardSummary, handleGetDashboardData} from "../../services/project.service.ts";
import {handleDeleteProject} from "../../services/project.service.ts";

type ProjectSchemaInput = z.infer<typeof projectValidationSchema>["body"];
type UpdateProjectSchemaInput = z.infer<typeof updateProjectValidationSchema>["body"];
type UpdateProjectSchemaParams = z.infer<typeof updateProjectValidationSchema>["params"];
type GetProjectSchemaParams = z.infer<typeof getProjectValidationSchema>["params"];
type GetProjectByIdSchemaParams = z.infer<typeof getProjectByIdValidationSchema>["params"];
type DeleteProjectByIdSchemaParams = z.infer<typeof deleteProjectByIdValidationSchema>["params"];
type DeleteProjectByIdSchemaInput = z.infer<typeof deleteProjectByIdValidationSchema>["body"];
type UpdateProjectStatusInput = z.infer<typeof updateProjectStatusValidationSchema>["body"];
type UpdateProjectStatusParams = z.infer<typeof updateProjectStatusValidationSchema>["params"];


export const createProject = async(req:Request<{}, {}, ProjectSchemaInput>, res:Response, next:NextFunction) => {
    try{
         const {description, endDate,remarks, ...restBody} = req.body;
         const projectData = {...restBody, ...description && {description}, ...endDate && {endDate}, ...remarks && {remarks}};
          const project = await Project.create(projectData);
          if(!project)return res.status(404).json({success:false, message:"Project Create Failed."});

          res.status(201).json({success:true, data:project, message:"Project created successfully."})
    }
    catch(error:any){
        console.log("Project Create Error:-", error?.message);
        next(error);
    }
};



export const getProject = async(req:Request<GetProjectSchemaParams, {}, {}>, res:Response, next:NextFunction) => {
    try{
          const project = await Project.find({companyId:req.params.companyId});

          res.status(200).json({success:true, data:project})
    }
    catch(error:any){
        console.log("Projects Get Error:-", error?.message);
        next(error);
    }
};



export const getByIdProject = async(req:Request<GetProjectByIdSchemaParams, {}, {}>, res:Response, next:NextFunction) => {
    try{
          const project = await getProjectByIdData({projectId:req.params.id, companyId:req.params.companyId});
          if(project?.success === false)return res.status(404).json({success:false, message: project?.message});

          res.status(200).json({success:true,data:project?.data})
    }
    catch(error:any){
        console.log("Project GetById Error:-", error?.message);
        next(error);
    }
};


export const deleteProject = async(req:Request<DeleteProjectByIdSchemaParams, {}, DeleteProjectByIdSchemaInput>, res:Response, next:NextFunction) => {
    try{
          const project = await handleDeleteProject({user:req.user,projectIds:req.body.projectIds,companyId:req.params.companyId});
          if(project?.success === false)return res.status(404).json({success:false, message:project?.message});

          res.status(200).json({success:true, message:project?.message, data:project?.data})
    }
    catch(error:any){
        console.log("Project Delete Error:-", error?.message);
        next(error);
    }
};



export const updateProject = async(req:Request<UpdateProjectSchemaParams, {}, UpdateProjectSchemaInput>, res:Response, next:NextFunction) => {
    try{
          const project = await Project.findOneAndUpdate({_id:req.params.id, companyId:req.params.companyId}, {$set:req.body}, {new:true, runValidators:true});
          if(!project)return res.status(404).json({success:false, message:"Project Not Found."});

          res.status(200).json({success:true, message:"Project updated successfully."})
    }
    catch(error:any){
        console.log("Project Update Error:-", error?.message);
        next(error);
    }
};



export const updateProjectStatus = async(req:Request<UpdateProjectStatusParams, {}, UpdateProjectStatusInput>, res:Response, next:NextFunction) => {
try {
      const subTask = await Project.findOneAndUpdate({_id:req.params.id, companyId:req.params.companyId}, {$set:{status:req.body.status}},{new:true, runValidators:true});
      if(!subTask) return res.status(404).json({success:false, message:"Sub Task Not Found."});

      res.status(200).json({success:true, message:"Project Status Update Successfully.", data:subTask})
}
catch(error:any){
    console.log("Update Sub Task  Error:-", error?.message);
    next(error);
}
};




export const completedAssigment = async(req:Request, res:Response, next:NextFunction) => {
    try{
          const completedData = await completedStatusAssignment({user:req?.user});
          if(completedData?.success === false) return res.status(404).json({success: false, message:completedData?.message});

          return res.status(200).json({success:true, message:completedData?.message, data:completedData?.data});
    }
    catch(error:any){
    console.log("Update Sub Task  Error:-", error?.message);
    next(error);
}
};


export const reassignedhistoryAssignment = async(req:Request, res:Response, next:NextFunction) => {
    try{
         const reassignedHistory = await reassignmentHistory({user:req?.user});

         if(reassignedHistory?.success === false) return res.status(404).json({success:false, message:reassignedHistory?.message});

         return res.status(200).json({success:true, message:reassignedHistory?.message, data:reassignedHistory?.data});
    }
    catch(error:any){
    console.log("Update Sub Task  Error:-", error?.message);
    next(error);
}
};





export const getDashboardData = async(req:Request, res:Response, next:NextFunction) => {
    try{
         const dashboardData = await handleGetDashboardData({user:req?.user});
         if(dashboardData?.success === false) return res.status(404).json({success:false, message:dashboardData?.message});

         return res.status(200).json({success:true, message:dashboardData?.message, data:dashboardData?.data});
    }
    catch(error:any){
    console.log("Get Dashboard Data  Error:-", error?.message);
    next(error);
}
};






export const getDashboardSummary = async(req:Request, res:Response, next:NextFunction) => {
    try{
         const dashboardSummary = await handleGetDashboardSummary({user:req?.user});
         if(dashboardSummary?.success === false) return res.status(404).json({success:false, message:dashboardSummary?.message});

         return res.status(200).json({success:true, message:dashboardSummary?.message, data:dashboardSummary?.data});
    }
    catch(error:any){
    console.log("Get Dashboard Summary  Error:-", error?.message);
    next(error);
}
};