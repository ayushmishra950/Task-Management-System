import mongoose from "mongoose";


interface ISession {
    userId:mongoose.Types.ObjectId,
    hashRefreshToken:string,
    isRevoked:boolean,
    deviceInfo?:string,
    ipAddress?:string,
    expiresAt:Date,
    createdAt:Date,
    updatedAt:Date,
    companyId:mongoose.Types.ObjectId | null,
    role:string,
}


const sessionSchema = new mongoose.Schema<ISession>({
    userId:{type:mongoose.Schema.Types.ObjectId, ref:"User", required:true},
    hashRefreshToken:{type:String, required:true, unique:true},
    isRevoked:{type:Boolean, default:false},
    deviceInfo:{type:String},
    ipAddress:{type:String},
    expiresAt:{type:Date, required:true},
    companyId:{type:mongoose.Schema.Types.ObjectId, ref:"Company",default: null, required: function(){ return this.role !== "super_admin"}},
    role:{type:String, enum:["super_admin","admin", "employee", "manager", "client" ], required:true},
},{timestamps:true});

sessionSchema.index({expiresAt:1}, {expireAfterSeconds:0})

const Session  = mongoose.model<ISession>("Session", sessionSchema);
export default Session;