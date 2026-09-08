import { Router } from "express";
import {
  createClientRequest,
  getMyClientRequests,
  getMyClientRequestById,
  updateMyClientRequest,
  deleteMyClientRequest,
  getClientDashboardSummary,
} from "../../controllers/client/clientRequest.controller.ts";
import { validate } from "../../middlewares/validate.middleware.ts";
import {
  createClientRequestValidationSchema,
  updateClientRequestValidationSchema,
  clientRequestIdValidationSchema,
} from "../../schemas/clientRequest.schema.ts";
import { authMiddleware } from "../../middlewares/auth.middleware.ts";
import { accessClientRoleOnly } from "../../middlewares/role.middleware.ts";

const router = Router();

router.post("/create", authMiddleware, accessClientRoleOnly, validate(createClientRequestValidationSchema), createClientRequest);
router.get("/get", authMiddleware, accessClientRoleOnly, getMyClientRequests);
router.get("/dashboard/summary", authMiddleware, accessClientRoleOnly, getClientDashboardSummary);
router.get("/getById/:id", authMiddleware, accessClientRoleOnly, validate(clientRequestIdValidationSchema), getMyClientRequestById);
router.put("/update/:id", authMiddleware, accessClientRoleOnly, validate(updateClientRequestValidationSchema), updateMyClientRequest);
router.delete("/delete/:id", authMiddleware, accessClientRoleOnly, validate(clientRequestIdValidationSchema), deleteMyClientRequest);

export default router;
