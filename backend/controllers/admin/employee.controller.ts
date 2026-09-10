import User from "../../models/user.model.ts";
import Task from "../../models/task.model.ts";
import SubTask from "../../models/subTask.model.ts";
import Session from "../../models/session.model.ts";
import type { Request, Response, NextFunction } from "express";
import {employeeValidationSchema, updateEmployeeValidationSchema,getEmployeeValdationSchema, getEmployeeByIdValidationSchema, updateEmployeeStatusValidationSchema} from "../../schemas/user.schema.ts";
import {processFile} from "../../utils/convertUrlFromFile.ts";
import {emitEmployeeStatusChanged, disconnectUserSockets} from "../../sockets/employee.socket.ts";
import {z} from "zod";

type EmployeeInput = z.infer<typeof employeeValidationSchema>["body"];
type UpdateEmployeeInput = z.infer<typeof updateEmployeeValidationSchema>["body"];
type UpdateEmployeeParams = z.infer<typeof updateEmployeeValidationSchema>["params"];
type GetEmployeeParams = z.infer<typeof getEmployeeValdationSchema>["params"];
type GetEmployeeByIdParams = z.infer<typeof getEmployeeByIdValidationSchema>["params"];
type UpdateEmployeeStatusParams = z.infer<typeof updateEmployeeStatusValidationSchema>["params"];
type UpdateEmployeeStatusInput = z.infer<typeof updateEmployeeStatusValidationSchema>["body"];

/** Completed / cancelled kaam kisi ko rok nahi sakta — sirf chalta hua kaam blocker hai. */
const OPEN_WORK = { $nin: ["completed", "cancelled"] };


export const registerEmployee = async ( req: Request<{},{}, EmployeeInput>, res: Response, next: NextFunction) => {
  try {
    const { department, documents, ...restBody} = req.body;
    const { aadharCard, panCard, bankPassBook, salarySlip} = documents || {};

    const files = req.files as { [fieldname: string]: Express.Multer.File[]} | undefined;

    const employeeData: any = { ...restBody, ...(department && { department })};   

    const aadharUrl = await processFile( aadharCard, files?.aadhaar?.[0], "employees/aadhaar");

    if (aadharUrl) employeeData.documents.aadharCard = aadharUrl;

    const panUrl = await processFile( panCard, files?.panCard?.[0], "employees/pan");

    if (panUrl) employeeData.documents.panCard = panUrl;

    const bankPassBookUrl = await processFile( bankPassBook, files?.bankPassbook?.[0],"employees/bank-passbook");

    if (bankPassBookUrl) employeeData.documents.bankPassBook = bankPassBookUrl;

    const salarySlipUrl = await processFile( salarySlip, files?.salarySlip?.[0], "employees/salary-slip");

    if (salarySlipUrl) employeeData.documents.salarySlip = salarySlipUrl;


    const employee = await User.create(employeeData);

    if (!employee) return res.status(404).json({ success: false, message: "Employee Create Failed."});

    return res.status(201).json({ success: true, message: `${req.body?.fullName} is Registered Successfully.`, data: employee});
  } catch (error: any) {
    console.log("Employee Register Error:-", error?.message);
    next(error);
  }
};


export const getEmployee = async(req:Request<GetEmployeeParams, {}, {}>, res:Response, next:NextFunction) => {
  try{
     const status = req.query?.status?.toString();

     const filter:any = {companyId:req.params.companyId, role:{$in:["employee", "manager"]}};
     if(status) filter.status = status;

     const employee = await User.find(filter).populate("department", "name").populate("managedDepartments", "name");
     if(!employee?.length)return res.status(404).json({message:"Employees Not Found.", success:false})
        res.status(200).json({success:true, data:employee});
    }
  catch(error:any){
    console.log("Employee Get Error:-", error?.message);
    next(error);
  }
};

export const getEmployeeById = async(req:Request<GetEmployeeByIdParams, {}, {}>, res:Response, next:NextFunction) => {
  try{
     const employee = await User.findOne({_id:req.params.id, companyId:req.params.companyId as string});
     if(!employee)return res.status(404).json({message:"Employee Not Found.", success:false})

        res.status(200).json({success:true, data:employee});
    }
  catch(error:any){
    console.log("Employee Get Error:-", error?.message);
    next(error);
  }
};

/**
 * Hard delete nahi hota. Pehle dekha jata hai ki user par koi chalta hua kaam to nahi —
 * agar hai to admin ko pehle wo kaam kisi aur ko reassign karna padega.
 * Sab clear hone par user RELIEVED ho jata hai (soft delete).
 */
export const deleteEmployee = async(req:Request<GetEmployeeByIdParams, {}, {}>,res:Response,next:NextFunction) => {
  try{
     const {id, companyId} = req.params;

     const employee = await User.findOne({_id:id, companyId, role:{$in:["employee", "manager"]}});
     if(!employee) return res.status(404).json({success:false, message:"Employee Not Found."});

     if(employee.status === "RELIEVED") return res.status(400).json({success:false, message:`${employee.fullName} is already relieved.`});

     // Manager ko tasks milte hain, employee ko sub tasks — par manager ko bhi
     // sub task assign ho sakta hai, isliye dono taraf dekhte hain.
     const [openTasks, openSubTasks] = await Promise.all([
        Task.find({companyId, managerId:id, status:OPEN_WORK} as any).select("name status").lean(),
        SubTask.find({companyId, employeeId:id, status:OPEN_WORK} as any).select("name status").lean(),
     ]);

     if(openTasks.length || openSubTasks.length){
        const parts:string[] = [];
        if(openTasks.length) parts.push(`${openTasks.length} task${openTasks.length > 1 ? "s" : ""}`);
        if(openSubTasks.length) parts.push(`${openSubTasks.length} sub task${openSubTasks.length > 1 ? "s" : ""}`);

        return res.status(409).json({
           success:false,
           message:`${employee.fullName} still has ${parts.join(" and ")} assigned. Please reassign the work to someone else before removing this ${employee.role}.`,
           data:{
              openTasks:openTasks.map((task:any) => ({_id:task._id, name:task.name, status:task.status})),
              openSubTasks:openSubTasks.map((subTask:any) => ({_id:subTask._id, name:subTask.name, status:subTask.status})),
           },
        });
     }

     employee.status = "RELIEVED";
     employee.active = false;
     await employee.save();

     // Login band karne ke liye sessions revoke + live sockets kaat do
     await Session.deleteMany({userId:employee._id});
     disconnectUserSockets({userId:employee._id});

     emitEmployeeStatusChanged({companyId, employeeId:employee._id, status:"RELIEVED", fullName:employee.fullName});

     return res.status(200).json({success:true, message:`${employee.fullName} has been relieved. You can activate them again from the Employees section.`});
  }
  catch(error:any){
    console.log("Employee Delete Failed.", error?.message);
    next(error);
  }
};


/** RELIEVED user ko wapas ACTIVE karne ke liye (ya ON_HOLD par rakhne ke liye). */
export const updateEmployeeStatus = async(req:Request<UpdateEmployeeStatusParams, {}, UpdateEmployeeStatusInput>,res:Response,next:NextFunction) => {
  try{
     const {id, companyId} = req.params;

     const employee = await User.findOne({_id:id, companyId, role:{$in:["employee", "manager"]}});
     if(!employee) return res.status(404).json({success:false, message:"Employee Not Found."});

     employee.status = req.body.status;
     employee.active = req.body.status === "ACTIVE";
     await employee.save();

     if(req.body.status !== "ACTIVE"){
        await Session.deleteMany({userId:employee._id});
        disconnectUserSockets({userId:employee._id});
     }

     emitEmployeeStatusChanged({companyId, employeeId:employee._id, status:req.body.status, fullName:employee.fullName});

     return res.status(200).json({success:true, message:`${employee.fullName} is now ${req.body.status === "ACTIVE" ? "active" : req.body.status.toLowerCase().replace("_", " ")}.`, data:{status:employee.status}});
  }
  catch(error:any){
    console.log("Employee Status Update Failed.", error?.message);
    next(error);
  }
};


export const updateEmployee = async(req:Request<UpdateEmployeeParams, {}, UpdateEmployeeInput>, res:Response,next:NextFunction) => {
    try{
        const { department, documents, ...restBody} = req.body;
    const { aadharCard, panCard, bankPassBook, salarySlip} = documents || {};

    const files = req.files as { [fieldname: string]: Express.Multer.File[]} | undefined;

    const employeeData: any = { ...restBody, ...(department && { department })};   

    const aadharUrl = await processFile( aadharCard, files?.aadhaar?.[0], "employees/aadhaar");

    if (aadharUrl) employeeData.documents.aadharCard = aadharUrl;

    const panUrl = await processFile( panCard, files?.panCard?.[0], "employees/pan");

    if (panUrl) employeeData.documents.panCard = panUrl;

    const bankPassBookUrl = await processFile( bankPassBook, files?.bankPassbook?.[0],"employees/bank-passbook");

    if (bankPassBookUrl) employeeData.documents.bankPassBook = bankPassBookUrl;

    const salarySlipUrl = await processFile( salarySlip, files?.salarySlip?.[0], "employees/salary-slip");

    if (salarySlipUrl) employeeData.documents.salarySlip = salarySlipUrl;


      const employee = await User.findOneAndUpdate({_id:req.params.id, companyId:req.params.companyId}, {$set:employeeData}, {returnDocument:"after", runValidators:true});
      if(!employee) return res.status(404).json({success:false, message:"Employee Not Found."});

      res.status(200).json({success:true, message:"Employee Update Successfully.", data:employee});
    }
    catch(error:any){
        console.log("Employee Update Error:-", error?.message);
        next(error);
    }
}