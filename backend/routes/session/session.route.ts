import {refreshSessionToken,updatePassword} from "../../controllers/session/refresh.controller.ts";
import { Router } from "express";
import {passwordValidationSchemas} from "../../schemas/password.schema.ts";
import { validate } from "../../middlewares/validate.middleware.ts";
import {authMiddleware} from "../../middlewares/auth.middleware.ts";

const router = Router();

router.post("/refresh-token", refreshSessionToken);

router.patch("/update/superadmin/password/:id",authMiddleware,validate(passwordValidationSchemas.superAdmin),updatePassword);
router.patch("/update/user/password/:id/:companyId",authMiddleware,validate(passwordValidationSchemas.user),updatePassword);

export default router;
