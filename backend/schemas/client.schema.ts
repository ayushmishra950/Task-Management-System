import { z } from "zod";

const objectId = (field: string) =>
  z.string({ message: `${field} is required.` }).regex(/^[0-9a-fA-F]{24}$/, { message: `Invalid ${field} format.` });

export const registerClientValidationSchema = z.object({
  body: z.object({
    fullName: z.string({ message: "Full name is required." }).min(1, { message: "Full name cannot be empty." }),
    email: z.string({ message: "Email is required." }).email({ message: "Invalid email format." }),
    password: z.string({ message: "Password is required." }).min(6, { message: "Password must be at least 6 characters." }),
    contact: z.string({ message: "Contact is required." }).min(6, { message: "Invalid contact number." }),
    clientCompanyName: z.string().optional(),
    address: z.string().optional(),
    designation: z.string().optional(),
    profileImage: z.string().optional(),
    remarks: z.string().optional(),
    companyId: objectId("Company ID"),
    createdBy: objectId("CreatedBy ID"),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const updateClientValidationSchema = z.object({
  params: z.object({ id: objectId("Client ID"), companyId: objectId("Company ID") }),
  query: z.object({}).optional(),
  body: registerClientValidationSchema.shape.body.partial(),
});

export const getClientValidationSchema = z.object({
  params: z.object({ companyId: objectId("Company ID") }),
  query: z.object({}).optional(),
  body: z.object({}).optional(),
});

export const getClientByIdValidationSchema = z.object({
  params: z.object({ id: objectId("Client ID"), companyId: objectId("Company ID") }),
  query: z.object({}).optional(),
  body: z.object({}).optional(),
});

export const loginClientValidationSchema = z.object({
  body: z.object({
    email: z.string({ message: "Email is required." }).email({ message: "Invalid email format." }),
    password: z.string({ message: "Password is required." }).min(1, { message: "Password cannot be empty." }),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});
