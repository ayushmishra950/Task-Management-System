import { z } from "zod";

const priorityEnum = z.enum(["low", "medium", "high", "urgent"], {
  message: "Priority must be either 'low', 'medium','urgent' or 'high'",
});


const statusEnum = z.enum(["pending" , "in_progress" , "completed" , "cancelled"], {
  message: "Status must be either 'pending' , 'in_progress' , 'completed' , 'cancelled'",
});

export const projectValidationSchema = z.object({
    body:z.object({
  name: z
    .string({
      message: "Name is required and must be a string",
    })
    .min(1, {
      message: "Name cannot be empty",
    }),

  description: z.string().optional(),

  url: z
    .string({
      message: "URL is required and must be a string",
    })
    .url({
      message: "Invalid URL format",
    }),

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


  priority: priorityEnum,

  status:statusEnum,

  remarks: z.string().optional(),

  // Admin project ko kisi client se link kar sakta hai; null bhejne par link hat jata hai
  clientId: z
    .union([
      z.string().regex(/^[0-9a-fA-F]{24}$/, { message: "Invalid Client ID format" }),
      z.null(),
    ])
    .optional(),

  createdBy: z
    .string({
      message: "CreatedBy ID is required",
    })
    .regex(/^[0-9a-fA-F]{24}$/, {
      message: "Invalid User ID format",
    }),

  companyId: z
    .string({
      message: "Company ID is required",
    })
    .regex(/^[0-9a-fA-F]{24}$/, {
      message: "Invalid Company ID format",
    }),
}),
 params:z.object({}).optional(),
 query:z.object({}).optional()
});


export const updateProjectValidationSchema = projectValidationSchema.extend({
    params:z.object({
        id:z.string({message:"Id is required."}),
        companyId:z.string({message:"companyId is required."})
    }),
    query:z.object({}).optional(),
    body:  projectValidationSchema.shape.body.partial(),
});


export const getProjectValidationSchema = z.object({
    params:z.object({
        companyId:z.string({message:"companyId is required."})
    }),
    query:z.object({}).optional(),
    body:z.object({}).optional(),
});


export const getProjectByIdValidationSchema = z.object({
    params:z.object({
        id:z.string({message:"id is required."}),
        companyId:z.string({message:"companyId is required."})
    }),
    query:z.object({}).optional(),
    body:z.object({}).optional(),
});



export const deleteProjectByIdValidationSchema = z.object({
    params:z.object({
        companyId:z.string({message:"companyId is required."})
    }),
    query:z.object({}).optional(),
    body:z.object({projectIds:z.array(z.string({message:"Project Id is must be string."})).min(1,{message:"At least one Project ID is required."})}),
});






export const updateProjectStatusValidationSchema = z.object({
    params:z.object({
        id:z.string({message:"Id is required."}),
        companyId:z.string({message:"companyId is required."})
    }),

    query:z.object({}).optional(),
    body:z.object({status:statusEnum}),
});