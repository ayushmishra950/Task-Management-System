import { Router } from "express";
import { loginClient, logoutClient, getClientProfileById, getMyProjects } from "../../controllers/client/client.controller.ts";
import { validate } from "../../middlewares/validate.middleware.ts";
import { loginClientValidationSchema, getClientByIdValidationSchema } from "../../schemas/client.schema.ts";
import { authMiddleware } from "../../middlewares/auth.middleware.ts";
import { accessClientRoleOnly } from "../../middlewares/role.middleware.ts";

const router = Router();

router.post("/login", validate(loginClientValidationSchema), loginClient);
router.put("/logout", authMiddleware, accessClientRoleOnly, logoutClient);
router.get("/getById/:id/:companyId", authMiddleware, accessClientRoleOnly, validate(getClientByIdValidationSchema), getClientProfileById);
router.get("/my-projects", authMiddleware, accessClientRoleOnly, getMyProjects);

export default router;
