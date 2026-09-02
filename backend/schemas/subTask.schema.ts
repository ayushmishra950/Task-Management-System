import { z } from "zod";

export const priorityEnum = z.enum(["low", "medium", "high", "urgent"], {
  message: "Priority must be either 'low', 'medium', or 'high'",
});


export const statusEnum = z.enum(["pending" , "in_progress" , "completed" , "cancelled"], {
  message: "Status must be either 'pending' , 'in_progress' , 'completed' , 'cancelled'",
});

export const subTaskValidationSchema = z.object({
    body:z.object({
  name: z
    .string({
      message: "Name is required and must be a string",
    })
    .trim()
    .min(1, {
      message: "Name cannot be empty",
    }),

  description: z
    .string({
      message: "Description must be a string",
    })
    .optional(),

  url: z
    .string({
      message: "URL is required and must be a string",
    })
    .url({
      message: "Invalid URL format",
    }),

  startDate: z.coerce.date({
    message: "Start date is required and must be a valid date",
  }),

  endDate: z.coerce.date({
    message: "End date is required and must be a valid date",
  }),

  employeeId: z
    .string({
      message: "Employee ID is required",
    })
    .regex(/^[0-9a-fA-F]{24}$/, {
      message: "Invalid Employee ID format",
    }),

  priority: priorityEnum,

  status: statusEnum,

  remarks: z
    .string({
      message: "Remarks must be a string",
    })
    .optional(),

  taskId: z
    .string({
      message: "Task ID is required",
    })
    .regex(/^[0-9a-fA-F]{24}$/, {
      message: "Invalid Task ID format",
    }),

  companyId: z
    .string({
      message: "Company ID is required",
    })
    .regex(/^[0-9a-fA-F]{24}$/, {
      message: "Invalid Company ID format",
    }),

  createdBy: z
    .string({
      message: "createdBy ID is required",
    })
    .regex(/^[0-9a-fA-F]{24}$/, {
      message: "Invalid CreatedBy ID format",
    }),

}),

 query: z.object({}).optional(),
 params:z.object({}).optional(),
});



export const updateSubTaskValidationSchema = subTaskValidationSchema.extend({
    params:z.object({
        id:z.string({message:"Id is required."}),
        companyId:z.string({message:"companyId is required."})
    }),
    query:z.object({}).optional(),
    body:subTaskValidationSchema.shape.body.partial(),
});


export const getSubTaskValidationSchema = z.object({
    params:z.object({
        companyId:z.string({message:"companyId is required."})
    }),

    query:z.object({taskId:z.string({message:"Task Id is required."}).optional()}),
    body:z.object({}).optional(),
});




export const getSubTaskByIdValidationSchema = z.object({
    params:z.object({
        id:z.string({message:"Id is required."}),
        companyId:z.string({message:"companyId is required."})
    }),

    query:z.object({}).optional(),
    body:z.object({}).optional(),
});



export const deleteSubTaskByIdValidationSchema = z.object({
    params:z.object({
        companyId:z.string({message:"companyId is required."})
    }),

    query:z.object({}).optional(),
    body:z.object({subTaskIds:z.array(z.string({message:"Sub Task Id must be a string."})).min(1,{message:"At least one task ID is required."})}),
});



export const updateSubTaskStatusValidationSchema = z.object({
    params:z.object({
        id:z.string({message:"Id is required."}),
        companyId:z.string({message:"companyId is required."})
    }),

    query:z.object({}).optional(),
    body:z.object({status:statusEnum}),
});