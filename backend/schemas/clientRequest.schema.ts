import { z } from "zod";

const objectId = (field: string) =>
  z.string({ message: `${field} is required.` }).regex(/^[0-9a-fA-F]{24}$/, { message: `Invalid ${field} format.` });

const priorityEnum = z.enum(["low", "medium", "high", "urgent"], {
  message: "Priority must be either 'low', 'medium', 'high' or 'urgent'.",
});

const requestTypeEnum = z.enum(["new_project", "project_update"], {
  message: "Request type must be either 'new_project' or 'project_update'.",
});

const requestStatusEnum = z.enum(["pending", "in_review", "approved", "rejected", "completed"], {
  message: "Status must be 'pending', 'in_review', 'approved', 'rejected' or 'completed'.",
});

const optionalDate = z.preprocess(
  (value) => (value === "" || value === null || value === undefined ? undefined : value),
  z.coerce.date().optional()
);

export const createClientRequestValidationSchema = z.object({
  body: z
    .object({
      requestType: requestTypeEnum,
      projectId: objectId("Project ID").optional(),
      title: z.string({ message: "Title is required." }).min(1, { message: "Title cannot be empty." }),
      description: z.string({ message: "Description is required." }).min(1, { message: "Description cannot be empty." }),
      priority: priorityEnum.optional(),
      expectedDate: optionalDate,
      referenceUrl: z.preprocess(
        (value) => (value === "" || value === null ? undefined : value),
        z.string().url({ message: "Invalid URL format." }).optional()
      ),
    })
    .refine((data) => data.requestType !== "project_update" || Boolean(data.projectId), {
      message: "Project is required for an update request.",
      path: ["projectId"],
    }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const updateClientRequestValidationSchema = z.object({
  params: z.object({ id: objectId("Request ID") }),
  query: z.object({}).optional(),
  body: z.object({
    requestType: requestTypeEnum.optional(),
    projectId: objectId("Project ID").optional(),
    title: z.string().min(1, { message: "Title cannot be empty." }).optional(),
    description: z.string().min(1, { message: "Description cannot be empty." }).optional(),
    priority: priorityEnum.optional(),
    expectedDate: optionalDate,
    referenceUrl: z.preprocess(
      (value) => (value === "" || value === null ? undefined : value),
      z.string().url({ message: "Invalid URL format." }).optional()
    ),
  }),
});

export const clientRequestIdValidationSchema = z.object({
  params: z.object({ id: objectId("Request ID") }),
  query: z.object({}).optional(),
  body: z.object({}).optional(),
});

export const reviewClientRequestValidationSchema = z.object({
  params: z.object({ id: objectId("Request ID") }),
  query: z.object({}).optional(),
  body: z.object({
    status: requestStatusEnum,
    adminRemarks: z.string().optional(),
  }),
});

export const convertClientRequestValidationSchema = z.object({
  params: z.object({ id: objectId("Request ID") }),
  query: z.object({}).optional(),
  body: z.object({
    name: z.string().min(1, { message: "Project name cannot be empty." }).optional(),
    description: z.string().optional(),
    url: z.preprocess(
      (value) => (value === "" || value === null ? undefined : value),
      z.string().url({ message: "Invalid URL format." }).optional()
    ),
    startDate: optionalDate,
    endDate: optionalDate,
    priority: priorityEnum.optional(),
    remarks: z.string().optional(),
  }),
});
