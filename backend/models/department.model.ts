import mongoose from "mongoose";

interface IDepartment {
    name:string,
    description?:string,
    createdBy:mongoose.Types.ObjectId,
    companyId:mongoose.Types.ObjectId,
    createdAt:Date,
    updatedAt:Date
};

const departmentSchema = new mongoose.Schema<IDepartment>({
    name:{type:String, required:true},
    description:{type:String},
    createdBy:{type:mongoose.Schema.Types.ObjectId, required:true},
    companyId:{type:mongoose.Schema.Types.ObjectId, required:true}
},{timestamps:true});

departmentSchema.index({companyId:1, name:1}, {unique:true});

const Department = mongoose.model<IDepartment>("Department", departmentSchema);

export default Department;
