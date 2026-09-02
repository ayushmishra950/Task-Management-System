import mongoose from "mongoose";
import type {priorityTypes, statusTypes} from "../types/global.ts";

export interface ISubTask {
    name:string,
    description?:string,
    url:string,
    startDate?:Date,
    endDate?:Date,
    employeeId:mongoose.Types.ObjectId,
    priority:priorityTypes,
     status:statusTypes,
    remarks?:string,
    taskId:mongoose.Types.ObjectId,
    companyId:mongoose.Types.ObjectId,
    createdBy:mongoose.Types.ObjectId,
}


const subTaskSchema = new mongoose.Schema<ISubTask>({
    name:{type:String, required:true},
    description:{type:String},
    url:{type:String, required:true},
    startDate:{type:Date,default:Date.now},
    endDate:{type:Date},
    employeeId:{type:mongoose.Schema.Types.ObjectId, ref:"User", required:true},
    priority:{type:String, enum:["low" , "medium" , "high" , "urgent"], default:"medium"},
    status: {type:String, enum:["pending" , "in_progress" , "completed" , "cancelled" ], default:"pending"},
    remarks:{type:String},
     taskId:{type:mongoose.Schema.Types.ObjectId, ref:"Task", required:true},
     companyId:{type:mongoose.Schema.Types.ObjectId, ref:"Company", required:true},
     createdBy:{type:mongoose.Schema.Types.ObjectId, ref:"User", required:true},
}, {timestamps:true});

subTaskSchema.index({companyId:1, taskId:1});
subTaskSchema.index({employeeId:1});

const SubTask = mongoose.model<ISubTask>("SubTask", subTaskSchema);

export default SubTask;