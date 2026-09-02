import User from "../../models/user.model.ts";
import type { Request, Response, NextFunction } from "express";
import {employeeValidationSchema, updateEmployeeValidationSchema,getEmployeeValdationSchema, getEmployeeByIdValidationSchema} from "../../schemas/user.schema.ts";
import {processFile} from "../../utils/convertUrlFromFile.ts";
import {z} from "zod";

type EmployeeInput = z.infer<typeof employeeValidationSchema>["body"];
type UpdateEmployeeInput = z.infer<typeof updateEmployeeValidationSchema>["body"];
type UpdateEmployeeParams = z.infer<typeof updateEmployeeValidationSchema>["params"];
type GetEmployeeParams = z.infer<typeof getEmployeeValdationSchema>["params"];
type GetEmployeeByIdParams = z.infer<typeof getEmployeeByIdValidationSchema>["params"];


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
     const employee = await User.find({companyId:req.params.companyId, role:{$in:["employee", "manager"]}}).populate("department", "name").populate("managedDepartments", "name");
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

export const deleteEmployee = async(req:Request<GetEmployeeByIdParams, {}, {}>,res:Response,next:NextFunction) => {
  try{
     const employee = await User.findOneAndDelete({_id:req.params.id, companyId:req.params.companyId});
     if(!employee) return res.status(404).json({success:false, message:"Employee Not Found."})

        res.status(200).json({message:"Employee Delete Successfully.", success:true})
  }
  catch(error:any){
    console.log("Employee Delete Failed.", error?.message);
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