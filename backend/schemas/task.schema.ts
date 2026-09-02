import { z } from "zod";
import mongoose from "mongoose";


export const priorityEnum = z.enum(["low", "medium", "high", "urgent"], {
  message: "Priority must be either 'low', 'medium', or 'high'",
});


export const statusEnum = z.enum(["pending" , "in_progress" , "completed" , "cancelled"], {
  message: "Status must be either 'pending' , 'in_progress' , 'completed' , 'cancelled'",
});

const objectIdSchema = z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
  message: "Invalid MongoDB ObjectId",
});

export const taskValidationSchema = z.object({
    body:z.object({
  name: z.string().min(1, "Name is required"),
  
  description: z.string().optional(),
  
  url: z.string().url("Invalid URL format"),
  
   startDate: z.coerce.date({
    message: "Invalid start date format",
  }),
  
  endDate: z.preprocess(
  (value) => {
    if (value === "" || value === null || value === undefined) {
      return undefined;
    }

    return value;
  },
  z.coerce.date().optional()
),
  
  managerId: z.coerce.string().pipe(objectIdSchema),
  
  priority: priorityEnum,

  status: statusEnum,
  
  remarks: z.string().optional(),
  
  createdBy: z.coerce.string().pipe(objectIdSchema),
  
  projectId: z.coerce.string().pipe(objectIdSchema),
  
  companyId: z.coerce.string().pipe(objectIdSchema),
}),
 query:z.object({}).optional(),
 params:z.object({}).optional(),
});


export const updateTaskValidationSchema = taskValidationSchema.extend({
    params:z.object({
        id:z.string({message:"Id is required."}),
        companyId:z.string({message:"companyId is required."})
    }),
    query:z.object({}).optional(),
    body:taskValidationSchema.shape.body.partial(),
});


export const getTaskValidationSchema = z.object({
    params:z.object({
        companyId:z.string({message:"companyId is required."}),
    }),
    query:z.object({projectId:z.string({message:"project Id is required."}).optional()}),
    body:z.object({}).optional(),
});


export const getTaskByIdValidationSchema = z.object({
    params:z.object({
        id:z.string({message:"Id is required."}),
        companyId:z.string({message:"companyId is required."}),
    }),
    query:z.object({}).optional(),
    body:z.object({}).optional(),
});



export const deleteTaskByIdValidationSchema = z.object({
    params:z.object({
        companyId:z.string({message:"companyId is required."}),
    }),
    query:z.object({}).optional(),
    body:z.object({taskIds:z.array(z.string({message:"Task Id must be a string."})).min(1,{message:"At least one task ID is required."})}),
});






export const updateTaskStatusValidationSchema = z.object({
    params:z.object({
        id:z.string({message:"Id is required."}),
        companyId:z.string({message:"companyId is required."})
    }),

    query:z.object({}).optional(),
    body:z.object({status:statusEnum}),
});