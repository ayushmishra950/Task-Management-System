import SubTask from "../../models/subTask.model.ts";
import type {Request, Response, NextFunction} from "express";
import {subTaskValidationSchema,deleteSubTaskByIdValidationSchema,updateSubTaskStatusValidationSchema,updateSubTaskValidationSchema,getSubTaskValidationSchema, getSubTaskByIdValidationSchema} from "../../schemas/subTask.schema.ts";
import {getSubTaskData} from "../../services/subTask.service.ts";
import {handleReassignedSubTask, handleCreateSubTasksFromExcel, handleUpdateBulkSubTaskData} from "../../services/subTask.service.ts";
import {createSubTaskSocket, updateSubTaskStatusSocket, deleteSubTaskSocket, updateSubTaskSocket} from "../../sockets/subTask.socket.ts";
import {z} from "zod";

type SubTaskInput = z.infer<typeof subTaskValidationSchema>["body"];
type UpdateSubTaskInput = z.infer<typeof updateSubTaskValidationSchema>["body"];
type UpdateSubTaskParams = z.infer<typeof updateSubTaskValidationSchema>["params"];
type GetSubTaskParams = z.infer<typeof getSubTaskValidationSchema>["params"];
type GetSubTaskQuery = z.infer<typeof getSubTaskValidationSchema>["query"];
type GetSubTaskByIdParams = z.infer<typeof getSubTaskByIdValidationSchema>["params"];
type DeleteSubTaskByIdParams = z.infer<typeof deleteSubTaskByIdValidationSchema>["params"];
type DeleteSubTaskByIdInput = z.infer<typeof deleteSubTaskByIdValidationSchema>["body"];
type UpdateSubTaskStatusInput = z.infer<typeof updateSubTaskStatusValidationSchema>["body"];
type UpdateSubTaskStatusParams = z.infer<typeof updateSubTaskStatusValidationSchema>["params"];



export const createSubTask = async(req:Request<{}, {}, SubTaskInput>, res:Response, next:NextFunction) => {
try {
     const {description,remarks, ...restBody} = req.body;
     const subTaskData = {...restBody, ...description && {description}, ...remarks && {remarks}}
      const subTask = await SubTask.create(subTaskData);     
      if(!subTask) return res.status(404).json({success:false, message:"Task create failed."});
     
     await createSubTaskSocket({user: req.user,employeeId: subTask.employeeId.toString(),subTask});

      res.status(201).json({success:true, message:"Sub Task create successfully.", data:subTask})
}
catch(error:any){
    console.log("create Sub Task Error:-", error?.message);
    next(error);
}
};



export const getSubTask = async(req:Request<GetSubTaskParams, {}, {}, GetSubTaskQuery>, res:Response, next:NextFunction) => {
try { 
    const subTask = await getSubTaskData({user:req.user, taskId:req.query.taskId});
      if(subTask?.success === false) return res.status(404).json({success:false, message:subTask?.message});
      res.status(200).json({success:true, data:subTask?.data})
}
catch(error:any){   
    console.log("Get Sub Task  Error:-", error?.message);
    next(error);
}
};


export const getByIdSubTask = async(req:Request<GetSubTaskByIdParams, {}, {}>, res:Response, next:NextFunction) => {
try {
      const subTask = await SubTask.findOne({_id:req.params.id, companyId:req.params.companyId});
      if(!subTask) return res.status(404).json({success:false, message:"Sub Task Not Found."});
     

      res.status(200).json({success:true, data:subTask})
}
catch(error:any){
    console.log("GetById Sub Task  Error:-", error?.message);
    next(error);
}
};


export const deleteSubTask = async(req:Request<DeleteSubTaskByIdParams, {}, DeleteSubTaskByIdInput>, res:Response, next:NextFunction) => {
try {
     const subTasks = await SubTask.find({ _id: { $in: req.body.subTaskIds }, companyId: req.params.companyId });

      const results = await SubTask.deleteMany({_id:{$in:req.body.subTaskIds}, companyId:req.params.companyId});
      if(results?.deletedCount === 0) return res.status(404).json({success:false, message:"Sub Task Not Found."});
      
      for (const subTask of subTasks) {
         await deleteSubTaskSocket({ user: req.user, employeeId: subTask.employeeId, subTask});
        }

      res.status(200).json({success:true, message:`${results.deletedCount} Sub Task(s) deleted successfully.`})
}
catch(error:any){
    console.log("Delete Sub Task  Error:-", error?.message);
    next(error);
}
};



export const updateSubTask = async(req:Request<UpdateSubTaskParams, {}, UpdateSubTaskInput>, res:Response, next:NextFunction) => {
try {
      const subTask = await SubTask.findOneAndUpdate({_id:req.params.id, companyId:req.params.companyId}, {$set:req.body},{new:true, runValidators:true});
      if(!subTask) return res.status(404).json({success:false, message:"Sub Task Not Found."});
       
      await updateSubTaskSocket({ user: req.user, employeeId: subTask.employeeId, subTask});

      res.status(200).json({success:true, message:"Sub Task Update Successfully.", data:subTask})
}
catch(error:any){
    console.log("Update Sub Task  Error:-", error?.message);
    next(error);
}
};






export const updateSubTaskStatus = async(req:Request<UpdateSubTaskStatusParams, {}, UpdateSubTaskStatusInput>, res:Response, next:NextFunction) => {
try {
      const subTask = await SubTask.findOneAndUpdate({_id:req.params.id, companyId:req.params.companyId}, {$set:{status:req.body.status}},{new:true, runValidators:true});
      if(!subTask) return res.status(404).json({success:false, message:"Sub Task Not Found."});

      await updateSubTaskStatusSocket({user:req.user, employeeId:subTask.employeeId.toString(), subTask});

      res.status(200).json({success:true, message:"Sub Task Status Update Successfully.", data:subTask})
}
catch(error:any){
    console.log("Update Sub Task  Error:-", error?.message);
    next(error);
}
};


export const reassignedSubTask = async(req:Request,res:Response, next:NextFunction) => {
   try {
    const subTask = await handleReassignedSubTask({user:req.user, subTaskId:req.params.subTaskId, newEmployeeId:req.params.newEmployeeId,startDate:req.body.startDate,endDate:req.body.endDate,reason:req.body.reason});
      if(subTask?.success === false) return res.status(404).json({success:false, message: subTask?.message});

      res.status(200).json({success:true, message:"Sub Task Reassigned Successfully.", data:subTask?.data});
}
    catch(error:any){
    console.log("Update Sub Task  Error:-", error?.message);
    next(error);
}
};



export const createSubTaskFromExcel = async(req:Request, res:Response, next:NextFunction) => {
  try{
        const subTask = await handleCreateSubTasksFromExcel({user:req.user,createdBy:req.params.createdBy,employeeId:req.params.employeeId,taskId:req.params.taskId,file:req.file});
        if(subTask.success === false) return res.status(404).json({message:subTask.message, success:false});

        res.status(201).json({success:true, message:subTask?.message, data:subTask?.data});
  }
   catch(error:any){
    console.log("Create Sub Task Excel Error:-", error?.message);
    next(error);
}
};








export const updateBulkSubTaskData = async(req:Request, res:Response, next:NextFunction) => {
  try{
        const subTask = await handleUpdateBulkSubTaskData({user:req.user, subTaskDatas:req.body.subTaskDatas});
        if(subTask.success === false) return res.status(404).json({message:subTask.message, success:false});

        res.status(200).json({success:true, message:subTask?.message, data:subTask?.data});
  }
   catch(error:any){
    console.log("Update Bulk Sub Task Error:-", error?.message);
    next(error);
}
};