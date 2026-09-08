import { Router } from "express";
import { registerClient, getClients, getClientById, updateClient, deleteClient } from "../../controllers/admin/client.controller.ts";
import { validate } from "../../middlewares/validate.middleware.ts";
import {
  registerClientValidationSchema,
  updateClientValidationSchema,
  getClientValidationSchema,
  getClientByIdValidationSchema,
} from "../../schemas/client.schema.ts";
import { authMiddleware } from "../../middlewares/auth.middleware.ts";
import { accessAdminRoleOnly } from "../../middlewares/role.middleware.ts";

const router = Router();

router.post("/register", authMiddleware, accessAdminRoleOnly, validate(registerClientValidationSchema), registerClient);
router.get("/get/:companyId", authMiddleware, accessAdminRoleOnly, validate(getClientValidationSchema), getClients);
router.get("/getById/:id/:companyId", authMiddleware, accessAdminRoleOnly, validate(getClientByIdValidationSchema), getClientById);
router.put("/update/:id/:companyId", authMiddleware, accessAdminRoleOnly, validate(updateClientValidationSchema), updateClient);
router.delete("/delete/:id/:companyId", authMiddleware, accessAdminRoleOnly, validate(getClientByIdValidationSchema), deleteClient);

export default router;
