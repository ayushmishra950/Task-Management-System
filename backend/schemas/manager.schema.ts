import {z} from "zod";

export const managerValidationSchema = z.object({
 params:z.object({
    id:z.string({message:"Id is required."}),
    companyId: z.string({message:"companyId is required."}),
    departmentId:z.string({message:"departmentId not found."}),
   }),
   query:z.object({}).optional(),
   body:z.object({}).optional(),
});


export const updateManagerValidationSchema = z.object({
   params:z.object({
    id:z.string({message:"Id is required."}),
    companyId: z.string({message:"companyId is required."}),
    oldDepartmentId:z.string({message:"oldDepartmentId is required."}),
    newDepartmentId:z.string({message:"newDepartmentId is required."}),
   }),
     query:z.object({}).optional(),
   body:z.object({}).optional(),
});




export const getManagerValidationSchema = z.object({
   params:z.object({
    companyId: z.string({message:"companyId is required."})
   }),

   query:z.object({}).optional(),
   body:z.object({}).optional(),
});