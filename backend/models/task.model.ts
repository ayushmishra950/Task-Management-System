import mongoose from "mongoose";
import type {priorityTypes, statusTypes} from "../types/global.ts";

export interface ITask{
    name:string,
    description?:string,
    url:string,
    startDate:Date,
    endDate?:Date,
    managerId:mongoose.Types.ObjectId,
    priority:priorityTypes,
     status:statusTypes,
    remarks?:string,
    createdBy:mongoose.Types.ObjectId,
    projectId:mongoose.Types.ObjectId,
    companyId:mongoose.Types.ObjectId,
    createdAt:Date,
    updatedAt:Date
};


const taskSchema = new mongoose.Schema<ITask>({
    name:{type:String, required:true},
    description:{type:String},
    url:{type:String, required:true},
    startDate:{type:Date, default:Date.now},
    endDate:{type:Date},
    managerId:{type:mongoose.Schema.Types.ObjectId,ref:"User", required:true},
    priority:{type:String, enum:["low" , "medium" , "high" , "urgent"], default:"medium"},
    status: {type:String, enum:["pending" , "in_progress" , "completed" , "cancelled" ], default:"pending"},
    remarks:{type:String},
    createdBy:{type:mongoose.Schema.Types.ObjectId, ref:"User", required:true},
    projectId:{type:mongoose.Schema.Types.ObjectId, ref:"Project", required:true},
    companyId:{type:mongoose.Schema.Types.ObjectId, ref:"Company", required:true},

}, {timestamps:true});

taskSchema.index({companyId:1, projectId:1});
taskSchema.index({managerId:1});

const Task = mongoose.model<ITask>("Task", taskSchema);

export default Task;