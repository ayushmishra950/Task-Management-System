import { z } from "zod";

export const departmentValidationSchema = z.object({
    body: z.object({
        name: z
            .string({ message: "Department name is required." })
            .trim()
            .min(1, { message: "Department name cannot be empty." })
            .min(2, { message: "Department name must be at least 2 characters long." })
            .max(50, { message: "Department name cannot exceed 50 characters." }),

        description: z
            .string({ message: "Description must be text." })
            .trim()
            .optional(),

        companyId: z
            .string({ message: "Company ID is required." })
            .trim()
            .regex(/^[0-9a-fA-F]{24}$/, { message: "Invalid Company ID format. Must be a 24-character hex string." }),

        createdBy: z
            .string({ message: "Created By Admin ID is required." })
            .trim()
            .regex(/^[0-9a-fA-F]{24}$/, { message: "Invalid Admin ID format. Must be a 24-character hex string." }),
    }),
    query: z.object({}).optional(),
    params: z.object({}).optional(),
});

export const updateDepartmentValidationSchema = departmentValidationSchema.extend({
    params: z.object({
        id: z.string({ message: "Department ID is required in params." }),
        companyId:z.string({message:"companyId is required."}),
    }),
    body: departmentValidationSchema.shape.body.partial(),
    query: z.object({}).optional(),
});

export const getDepartmentValidationSchema = z.object({
    params: z.object({
        companyId:z.string({message:"companyId is required."}),
    }),
    body:z.object({}).optional(),
    query:z.object({}).optional()
});


export const deleteDepartmentValidationSchema = z.object({
    params: z.object({
        id:z.string({message:"id is required."}),
        companyId:z.string({message:"companyId is required."})
    }),
    body:z.object({}).optional(),
    query:z.object({}).optional()
});
