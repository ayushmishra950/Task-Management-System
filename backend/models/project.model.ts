import mongoose from "mongoose";
import type {priorityTypes, statusTypes} from "../types/global.ts";

export interface IProject {
    name:string, 
    description?:string,
    url:string,
    startDate:Date,
    endDate?:Date,
    priority:priorityTypes,
    status:statusTypes,
    remarks?:string,
    createdBy:mongoose.Types.ObjectId,
    companyId:mongoose.Types.ObjectId,
};


const projectSchema = new mongoose.Schema<IProject>({
    name:{type:String, required:true},
    description:{type:String},
    url:{type:String},
    startDate:{type:Date, default:Date.now},
    endDate:{type:Date},
    priority: {type:String, enum:["low", "medium", "high", "urgent" ], default:"medium"},
    status: {type:String, enum:["pending" , "in_progress" , "completed" , "cancelled" ], default:"pending"},
    remarks:{type:String},
    createdBy:{type:mongoose.Schema.Types.ObjectId, ref:"User", required:true},
    companyId:{type:mongoose.Schema.Types.ObjectId, ref:"Company", required:true}
}, {timestamps:true});

projectSchema.index({companyId:1, name:1}, {unique:true});

const Project = mongoose.model<IProject>("Project", projectSchema);

export default Project;
