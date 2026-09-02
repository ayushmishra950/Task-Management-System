
import { z } from "zod";

export const statusEnum = z.boolean({
  message: "Status must be either true or false",
});

export const adminValidationSchema = z.object({
    body: z.object({
    fullName: z
        .string({ message: "Full name must be text" })
        .trim()
        .min(1, { message: "Full name is required" })
        .min(3, { message: "Name must be at least 3 characters long" })
        .max(50, { message: "Name cannot exceed 50 characters" }),

    email: z
        .string({ message: "Email must be text" })
        .trim()
        .lowercase()
        .min(1, { message: "Email is required" })
        .email({ message: "Invalid email format" }),

    password: z
        .string({ message: "Password must be text" })
        .min(1, { message: "Password is required" })
        .min(8, { message: "Password must be at least 8 characters long" }),
     
        profileImage: z
        .string({ message: "Profile image path must be text" })
        .trim()
        .optional(),
   
    contact: z
        .string({ message: "Contact number must be text" })
        .trim()
        .min(1, { message: "Contact number is required" })
        .regex(/^[0-9]{10}$/, { message: "Contact must be a valid 10-digit number" }),
        
    role: z
        .string({ message: "Role is required" })
        .trim()
        .refine((val) => val === "admin", {
            message: "Role must be exactly 'Admin' for this schema",
        }),

    companyId: z
        .string({ message: "Company ID is required" })
        .trim()
        .regex(/^[0-9a-fA-F]{24}$/, { message: "Invalid Company ID format" }),

    createdBy: z
        .string({ message: " Admin ID is required" })
        .trim()
        .regex(/^[0-9a-fA-F]{24}$/, { message: "Invalid Admin ID format" }),

    }),
    query: z.object({}).optional(),
    params: z.object({}).optional(),
});


export const updateAdminValidationSchema = adminValidationSchema.extend({
    params : z.object({
        id:z.string({message:"Id is required."}),
        companyId:z.string({message:"company Id is required."}),
    }),

    body : adminValidationSchema.shape.body.partial().extend({
        password: z.string({message: "Password must be text"})
        .refine((value) => value === "" || value.length > 8,
        {
            message:"Password must be at least 8 characters long"
        }
    ).optional()
    }),
    query:z.object({}).optional(),
});

export const getAdminValdationSchema = z.object({
    params : z.object({
  companyId:z.string({message:"company Id is required."})
    }),
    body : z.object({}).optional(),
    query:z.object({}).optional(),
});


export const getAdminByIdValidationSchema = z.object({
    params: z.object({
        id:z.string({message:"Id is required."}),
        companyId:z.string({message:"company Id is required."}),
    }),
    query:z.object({}).optional(),
    body:z.object({}).optional(),
});



export const loginAdminValidationSchema = z.object({
    params: z.object({}).optional(),
    query:z.object({}).optional(),
    body:z.object({
        email: z
        .string({ message: "Email must be text" })
        .trim()
        .lowercase()
        .min(1, { message: "Email is required" })
        .email({ message: "Invalid email format" }),

    password: z
        .string({ message: "Password must be text" })
        .min(1, { message: "Password is required" })
        .min(8, { message: "Password must be at least 8 characters long" }),
     
    }),
});




export const updateAdminStatusValidationSchema = z.object({
    params:z.object({
        id:z.string({message:"Id is required."}),
        companyId:z.string({message:"companyId is required."})
    }),

    query:z.object({}).optional(),
    body:z.object({status:statusEnum}),
});
