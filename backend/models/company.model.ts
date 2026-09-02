import mongoose from "mongoose";


interface ICompany{
    name:string,
    email:string,
    contact:string,
    address:string,
    website:string,
    logo?:string,
    active:boolean,
    createdAt:Date,
    updatedAt:Date,
    createdBy:mongoose.Types.ObjectId,
};


const companySchema = new mongoose.Schema<ICompany>({
    name:{type:String, required:true},
    email:{type:String, required:true},
    contact:{type:String, required:true},
    address:{type:String, required:true},
    website:{type:String, required:true},
    logo:{type:String},
    active:{type:Boolean, default:false},
    createdBy:{type:mongoose.Schema.Types.ObjectId, ref:"Super_Admin", required:true}
},{timestamps:true});

companySchema.index({name:1, email:1, website:1}, {unique:true});


const Company = mongoose.model<ICompany>("Company", companySchema);

export default Company;