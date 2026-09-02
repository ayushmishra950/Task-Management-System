import {z} from "zod";

export const  deleteNotificationFromSchema = z.object({
  
    params:z.object({
         notificationId: z
            .string({ message: "Notification ID is required." })
            .trim()
            .regex(/^[0-9a-fA-F]{24}$/, { message: "Invalid Notification ID format. Must be a 24-character hex string." }),
    }),

     query:z.object({}).optional(),
       body:z.object({}).optional(),
});