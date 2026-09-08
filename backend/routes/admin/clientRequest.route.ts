import { Router } from "express";
import {
  getAllClientRequests,
  getClientRequestById,
  reviewClientRequest,
  convertRequestToProject,
  deleteClientRequestByAdmin,
} from "../../controllers/admin/clientRequest.controller.ts";
import { validate } from "../../middlewares/validate.middleware.ts";
import {
  clientRequestIdValidationSchema,
  reviewClientRequestValidationSchema,
  convertClientRequestValidationSchema,
} from "../../schemas/clientRequest.schema.ts";
import { authMiddleware } from "../../middlewares/auth.middleware.ts";
import { accessAdminRoleOnly } from "../../middlewares/role.middleware.ts";

const router = Router();

router.get("/get", authMiddleware, accessAdminRoleOnly, getAllClientRequests);
router.get("/getById/:id", authMiddleware, accessAdminRoleOnly, validate(clientRequestIdValidationSchema), getClientRequestById);
router.patch("/review/:id", authMiddleware, accessAdminRoleOnly, validate(reviewClientRequestValidationSchema), reviewClientRequest);
router.post("/convert/:id", authMiddleware, accessAdminRoleOnly, validate(convertClientRequestValidationSchema), convertRequestToProject);
router.delete("/delete/:id", authMiddleware, accessAdminRoleOnly, validate(clientRequestIdValidationSchema), deleteClientRequestByAdmin);

export default router;
