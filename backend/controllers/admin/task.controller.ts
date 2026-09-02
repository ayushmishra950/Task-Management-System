import Task from "../../models/task.model.ts";
import type {Request, Response, NextFunction} from "express";
import {taskValidationSchema,deleteTaskByIdValidationSchema,updateTaskStatusValidationSchema, updateTaskValidationSchema, getTaskValidationSchema, getTaskByIdValidationSchema} from "../../schemas/task.schema.ts";
import {getTaskData} from "../../services/task.service.ts";
import {handleReassignedTask, handleCreateTasksFromExcel, getTaskByIdData,handleDeleteTaskData, handleUpdateBulkTaskData} from "../../services/task.service.ts";
import {z} from "zod";
import {updateTaskStatusSocket, createTaskSocket, updateTaskSocket} from "../../sockets/task.socket.ts";


type TaskInput = z.infer<typeof taskValidationSchema>["body"];
type UpdateTaskInput = z.infer<typeof updateTaskValidationSchema>["body"];
type UpdateTaskParams = z.infer<typeof updateTaskValidationSchema>["params"];
type GetTaskQuery = z.infer<typeof getTaskValidationSchema>["query"];
type GetTaskParams = z.infer<typeof getTaskValidationSchema>["params"];
type GetTaskByIdParams = z.infer<typeof getTaskByIdValidationSchema>["params"];
type DeleteTaskByIdParams = z.infer<typeof deleteTaskByIdValidationSchema>["params"];
type DeleteTaskByIdBody = z.infer<typeof deleteTaskByIdValidationSchema>["body"];
type UpdateTaskStatusInput = z.infer<typeof updateTaskStatusValidationSchema>["body"];
type UpdateTaskStatusParams = z.infer<typeof updateTaskStatusValidationSchema>["params"];


export const createTask = async(req:Request<{}, {}, TaskInput>, res:Response, next:NextFunction) => {
try {
     const {description,endDate,remarks, ...restBody} = req.body;
     const taskData = {...restBody, ...description && {description}, ...endDate && {endDate}, ...remarks && {remarks}};
      const task = await Task.create(taskData);
      if(!task) return res.status(404).json({success:false, message:"Task create failed."});

      await createTaskSocket({user: req.user, managerId: task.managerId, task});

      res.status(201).json({success:true, message:"Task create successfully.", data:task});
}
catch(error:any){
    console.log("create Task Error:-", error?.message);
    next(error);
}
};



export const getTask = async(req:Request<GetTaskParams, {}, {}, GetTaskQuery>, res:Response, next:NextFunction) => {
try {
    const task = await getTaskData({user:req.user, projectId:req.query.projectId});
      if(task?.success === false) return res.status(404).json({success:false, message:task?.message});
      res.status(200).json({success:true, data:task?.data});
}
catch(error:any){
    console.log("Get Task  Error:-", error?.message);
    next(error);
}
};


export const getByIdTask = async(req:Request<GetTaskByIdParams, {}, {}>, res:Response, next:NextFunction) => {
try {
      const task = await getTaskByIdData({taskId:req.params.id, companyId:req.params.companyId});
      if(task?.success === false) return res.status(404).json({success:false, message: task?.message});

      res.status(200).json({success:true, data:task?.data});
}
catch(error:any){
    console.log("GetById Task  Error:-", error?.message);
    next(error);
}
};


export const deleteTask = async(req:Request<DeleteTaskByIdParams, {}, DeleteTaskByIdBody>, res:Response, next:NextFunction) => {
try {
      const task = await handleDeleteTaskData({user:req.user,taskIds:req.body.taskIds, companyId:req.params.companyId});
      if(task?.success === false) return res.status(404).json({success:false, message:task?.message});

      res.status(200).json({success:true, message:task?.message, data:task?.data});
}
catch(error:any){
    console.log("Delete Task  Error:-", error?.message);
    next(error);
}
};



export const updateTask = async(req:Request<UpdateTaskParams, {}, UpdateTaskInput>, res:Response, next:NextFunction) => {
try {
      const task = await Task.findOneAndUpdate({_id:req.params.id, companyId:req.params.companyId},{$set:req.body}, {new:true, runValidators:true});
      if(!task) return res.status(404).json({success:false, message:"Task Not Found."});
       
      await updateTaskSocket({user: req.user, managerId: task.managerId,task});

      res.status(200).json({success:true, message:"Task Update Successfully.", data:task})
}
catch(error:any){
    console.log("Update Task  Error:-", error?.message);
    next(error);
}
};



export const updateTaskStatus = async(req:Request<UpdateTaskStatusParams, {}, UpdateTaskStatusInput>, res:Response, next:NextFunction) => {
try {
      const task = await Task.findOneAndUpdate({_id:req.params.id, companyId:req.params.companyId}, {$set:{status:req.body.status}},{new:true, runValidators:true});
      if(!task) return res.status(404).json({success:false, message:"Sub Task Not Found."});
      
      await updateTaskStatusSocket({user:req.user, managerId:task?.managerId, task});
      
      res.status(200).json({success:true, message:"Task Status Update Successfully.", data:task})
}
catch(error:any){
    console.log("Update Sub Task  Error:-", error?.message);
    next(error);
}
};


export const reassignTask = async(req:Request, res:Response, next:NextFunction) => {
    try{
        const task = await handleReassignedTask({ user:req.user, taskId:req.params.taskId, newManagerId:req.params.newManagerId, startDate:req.body.startDate, endDate:req.body.endDate, reason:req.body.reason});
        if(task?.success === false) return res.status(404).json({success:false, message:task?.message});

        res.status(200).json({success:true, message:"Task Reassign successfully.", data:task?.data})
    }
    catch(error:any){
    console.log("Reassign Sub Task  Error:-", error?.message);
    next(error);
}
};



export const createTaskFromExcel = async(req:Request, res:Response, next:NextFunction) => {
   try{
      const task = await handleCreateTasksFromExcel({user:req.user, createdBy:req.params.createdBy, managerId:req.params.managerId, projectId:req.params.projectId, file:req.file});
      if(task.success === false) return res.status(404).json({success:false, message:task.message});

    res.status(201).json({success:true, message:task.message, data:task.data});
   }
   catch(error:any){
    console.log("Create Sub Task Excel Error:-", error?.message);
    next(error);
   }
};




export const updateBulkTaskData = async(req:Request, res:Response, next:NextFunction) => {
   try{
      const task = await handleUpdateBulkTaskData({user:req.user, taskDatas:req.body.taskDatas});
      if(task.success === false) return res.status(404).json({success:false, message:task.message});

      res.status(200).json({success:true, message:task.message, data:task.data});
   }
   catch(error:any){
    console.log("Update Bulk Task Data Error:-", error?.message);
    next(error);
   }
};