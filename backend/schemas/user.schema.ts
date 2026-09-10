
import { z } from "zod";

export const employeeValidationSchema = z.object({
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

    department: z
        .string({ message: "Department ID must be text" })
        .trim()
        .regex(/^[0-9a-fA-F]{24}$/, { message: "Invalid Department ID format" })
        .optional(), 

    designation: z
        .string({ message: "Designation must be text" })
        .trim()
        .min(1, { message: "Designation is required for an employee" }),

    contact: z
        .string({ message: "Contact number must be text" })
        .trim()
        .min(1, { message: "Contact number is required" })
        .regex(/^[0-9]{10}$/, { message: "Contact must be a valid 10-digit number" }),

    monthSalary: z
        .string({ message: "Monthly salary must be text" })
        .trim()
        .min(1, { message: "Monthly salary is required" }),

    joiningDate: z
        .string({ message: "Joining date is required" })
        .min(1, { message: "Joining date is required" })
        .refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date format" }),

    profileImage: z
        .string({ message: "Profile image path must be text" })
        .trim()
        .optional(),

    employeeType: z
        .enum(["parmanent", "intern", "contract"], {
            message: "Employee type must be parmanent, intern, or contract" 
        }),

    responsibility: z
        .string({ message: "Responsibility must be text" })
        .trim()
        .min(1, { message: "Responsibility description is required" }).optional(),

    lpa: z
        .string({ message: "LPA must be text" })
        .trim()
        .min(1, { message: "LPA is required" }),

    documents: z
        .object({
            salarySlip: z.string().trim().optional(),
            aadharCard: z.string().trim().min(1, { message: "Aadhar card path is required" }).optional(),
            panCard: z.string().trim().min(1, { message: "PAN card path is required" }).optional(),
            bankPassBook: z.string().trim().min(1, { message: "Bank passbook path is required" }).optional(),
        })
        .optional(),

    ifscCode: z
        .string({ message: "IFSC code must be text" })
        .trim()
        .min(1, { message: "IFSC code is required" })
        .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, { message: "Invalid IFSC code format" }).optional(), // Standard Indian IFSC Format Check

    remarks: z
        .string({ message: "Remarks must be text" })
        .trim()
        .optional(),

    role: z
        .string({ message: "Role is required" })
        .trim()
        .refine((val) => val === "employee", {
            message: "Role must be exactly 'employee' for this schema",
        }),

    companyId: z
        .string({ message: "Company ID is required" })
        .trim()
        .regex(/^[0-9a-fA-F]{24}$/, { message: "Invalid Company ID format" }),

    createdBy: z
        .string({ message: "Created By Admin ID is required" })
        .trim()
        .regex(/^[0-9a-fA-F]{24}$/, { message: "Invalid Admin ID format" }),
    }),
    query: z.object({}).optional(),
    params: z.object({}).optional(),
});


export const updateEmployeeValidationSchema = employeeValidationSchema.extend({
    params : z.object({
        id:z.string({message:"Id is required."}),
        companyId:z.string({message:"company Id is required."}),
    }),

    body : employeeValidationSchema.shape.body.partial(),
    query:z.object({}).optional(),
});

export const getEmployeeValdationSchema = z.object({
    params : z.object({
        companyId:z.string({message:"company Id is required."})
    }),
    body : z.object({}).optional(),
    // Forms sirf ACTIVE log chahte hain, Employees page sabko
    query:z.object({
        status: z.enum(["ACTIVE", "RELIEVED", "ON_HOLD"]).optional(),
    }).optional(),
});


/** Soft delete ko wapas palatne ke liye (RELIEVED -> ACTIVE). */
export const updateEmployeeStatusValidationSchema = z.object({
    params : z.object({
        id:z.string({message:"Id is required."}),
        companyId:z.string({message:"company Id is required."}),
    }),
    body : z.object({
        status: z.enum(["ACTIVE", "RELIEVED", "ON_HOLD"], {message:"Status must be ACTIVE, RELIEVED or ON_HOLD."}),
    }),
    query:z.object({}).optional(),
});


export const getEmployeeByIdValidationSchema = z.object({
    params: z.object({
        id:z.string({message:"Id is required."}),
        companyId:z.string({message:"company Id is required."}),
    }),
    query:z.object({}).optional(),
    body:z.object({}).optional(),
});





export const loginEmployeeValidationSchema = z.object({
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

