import { z } from "zod";
import mongoose from "mongoose";

const objectIdSchema = z.string().refine(
  (val) => mongoose.Types.ObjectId.isValid(val), 
  { message: "Invalid MongoDB ObjectId format" }
);
 
export const companyValidationSchema = z.object({
    body:z.object({
  name: z
    .string({
      error: (issue) => issue.input === undefined ? "Company name is required" : "Invalid name format"
    })
    .min(1, { message: "Company name cannot be empty" }) 
    .max(100, { message: "Company name cannot exceed 100 characters" })
    .trim(),
    
  email: z
    .email({
      error: (issue) => issue.input === undefined ? "Company email is required" : "Invalid email address format"
    })
    .lowercase()
    .trim(),
    
  contact: z
    .string({
      error: (issue) => issue.input === undefined ? "Contact number is required" : "Invalid contact format"
    })
    .min(10, { message: "Contact number must be at least 10 digits" })
    .max(15, { message: "Contact number cannot exceed 15 digits" })
    .trim(),
    
  address: z
    .string({
      error: (issue) => issue.input === undefined ? "Address is required" : "Invalid address format"
    })
    .min(5, { message: "Address must be at least 5 characters long" })
    .trim(),
    
  website: z
    .url({
      error: (issue) => issue.input === undefined ? "Website URL is required" : "Invalid website URL format (e.g., https://example.com)"
    })
    .trim(),
    
  logo: z
    .url({ message: "Logo must be a valid image URL" })
    .optional(), 
    
    active: z.preprocess((value) => { 
      if(value === "true") return true;
      if(value === "false") return false;
      return value;
    }, z.boolean().default(false)
  ),
    
  createdBy: objectIdSchema,
}),

 params:z.object({}).optional(),
 query:z.object({}).optional(),
});




export const updateCompanyValidationSchema = companyValidationSchema.extend({
    params:z.object({
        id:z.string({message:"Id is required."})
    }),

    query:z.object({}).optional(),
    body: companyValidationSchema.shape.body.partial(),
});



export const getByIdCompanyValidationSchema = companyValidationSchema.extend({
    params:z.object({
        id:z.string({message:"Id is required."})
    }),

    query:z.object({}).optional(),
    body: z.object({}).optional(),
});