import mongoose from "mongoose";
import bcrypt from "bcrypt";

interface ISuperAdmin {
   fullName:string,
    email:string,
    password:string,
    contact:string,
    address:string,
    createdAt:Date,
    updatedAt:Date,
    role: "super_admin";
    companyId: mongoose.Types.ObjectId | null;
};

const superAdminSchema = new mongoose.Schema<ISuperAdmin>({
    fullName:{type:String, required:true},
    email:{type:String, required:true, unique:true},
    password:{type:String, required:true},
    contact:{type:String, requird:true},
    address:{type:String, required:true},
    role:{type:String, enum:["super_admin"], default:"super_admin"},
    companyId:{type:mongoose.Schema.Types.ObjectId, default:null},
}, {timestamps:true});

superAdminSchema.pre("save", async function(){
    const user  = this;

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
})


const SuperAdmin = mongoose.model<ISuperAdmin>("Super_Admin", superAdminSchema);

export default SuperAdmin;