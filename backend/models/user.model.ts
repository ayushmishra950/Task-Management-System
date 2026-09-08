import mongoose from "mongoose";
import type {employeeTypes, employeeStatusTypes} from "../types/global.ts";
import bcrypt from "bcrypt";
    
 type Role = "admin" | "employee" | "manager" | "client";

interface IUser {
    fullName:string,
    email:string,
    password:string,
    address?:string,
    department?:mongoose.Types.ObjectId,
    designation?:string,
    contact:string,
    monthSalary?:string,
    joiningDate?:Date,
    profileImage?:string;
    employeeType?:employeeTypes,
    responsibility?:string,
    lpa?:string,
    status: employeeStatusTypes,
    documents?:{
        salarySlip:string,
        aadharCard:string,
        panCard:string,
        bankPassBook:string,
    },
    ifscCode?:string,
    remarks?:string,
    role:Role,
    companyId:mongoose.Types.ObjectId,
    createdBy:mongoose.Types.ObjectId,
    createdAt:Date,
    updatedAt:Date,
    managedDepartments?:mongoose.Types.ObjectId[],
    clientCompanyName?:string,
    active:boolean,
};


 const userSchema = new mongoose.Schema<IUser>({
    fullName:{type:String, required:true},
    email:{type:String, required:true},
    password:{type:String, required:false},
    address:{type:String},
    department:{type:mongoose.Schema.Types.ObjectId, ref:"Department"},
    designation:{type:String},
    contact:{type:String,required:true },
    monthSalary:{type:String},
    joiningDate:{type:Date},
    profileImage:{type:String},
    employeeType:{type:String, enum:["parmanent", "intern", "contract"]},
    responsibility:{type:String},
    lpa:{type:String},
    ifscCode:{type:String},
    remarks:{type:String},
    role:{type:String, enum:["admin", "employee", "manager", "client"], required:true},
    companyId:{type:mongoose.Schema.Types.ObjectId, ref:"Company", required:true},
    createdBy:{type:mongoose.Schema.Types.ObjectId, required:true},
    managedDepartments:[{type:mongoose.Schema.Types.ObjectId, ref:"Department"}],
    clientCompanyName:{type:String},
    active:{type:Boolean, default:false},
    status:{type:String, enum:["ACTIVE", "RELIEVED", "ON_HOLD"], default:"ACTIVE"}
    
 },{timestamps:true});

  userSchema.index({companyId:1, email:1}, {unique:true});

  userSchema.pre("save", async function (){
    const user = this;
    
     if(!user.isModified("password")){
        return;
     }
     try{
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
     }
     catch(error:any){
        throw error;
     }
  });

 const User = mongoose.model<IUser>("User", userSchema);

 export default User;
