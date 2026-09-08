import { z } from "zod";

const passwordSchema = z
  .string({ message: "Password must be text" })
  .min(1, { message: "Password is required" })
  .min(8, { message: "Password must be at least 8 characters long" });

export const passwordValidationSchemas = {
  superAdmin: z.object({
    params: z.object({
      id: z.string({ message: "Id is required." }),
    }),
    body: z.object({
      role: z.literal("super_admin"),
      password: passwordSchema,
    }),
  }),

  user: z.object({
    params: z.object({
      id: z.string({ message: "Id is required." }),
      companyId: z.string({ message: "companyId is required." }), // यहाँ Required है
    }),
    body: z.object({
      role: z.enum(["admin", "manager", "employee", "client"], { message: "Invalid role" }),
      password: passwordSchema,
    }),
  }),
};

export const fullUnionSchema = z.union([
  passwordValidationSchemas.superAdmin,
  passwordValidationSchemas.user,
]);
