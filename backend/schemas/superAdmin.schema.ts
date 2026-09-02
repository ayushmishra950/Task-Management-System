import { z } from "zod";

export const superAdminValidationSchema = z.object({
    body : z.object({
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
        .min(8, { message: "Password must be at least 8 characters long" })
        .max(30, { message: "Password cannot exceed 30 characters" })
        .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
        .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
        .regex(/[0-9]/, { message: "Password must contain at least one number" })
        .regex(/[^A-Za-z0-9]/, { message: "Password must contain at least one special character" }),

    contact: z
        .string({ message: "Contact number must be text" })
        .trim()
        .min(1, { message: "Contact number is required" })
        .regex(/^[0-9]{10}$/, { message: "Contact must be a valid 10-digit number" }),

    address: z
        .string({ message: "Address must be text" })
        .trim()
        .min(1, { message: "Address is required" })
        .min(10, { message: "Address must be at least 10 characters long" })
        .max(200, { message: "Address cannot exceed 200 characters" }),

    role: z
        .string({ message: "Role is required" })
        .trim()
        .min(1, { message: "Role is required" })
        .refine((val) => val === "super_admin", {
            message: "Role must be exactly 'super Admin'",
        }),
    }),
    query: z.object({}).optional(),
    params: z.object({}).optional(),
});




export const updateSuperAdminValidationSchema = superAdminValidationSchema.extend({
    params : z.object({
        id: z.string({message:"Id is required."})
    }),

    body:superAdminValidationSchema.shape.body.partial(),
    query:z.object({}).optional(),
});

export const getSuperAdminValidationSchema = z.object({
    params : z.object({
        id:z.string({message:"Id is required."})
    }),
    query:z.object({}).optional(),
    body:z.object({}).optional(),
});




export const loginSuperAdminValidationSchema = z.object({
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







