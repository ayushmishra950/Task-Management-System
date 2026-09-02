import {Router} from "express";
import {getAllNotifications, deleteNotification, deleteAllNotification, markAllNotification} from "../../controllers/admin/notification.controller.ts";
import {authMiddleware} from "../../middlewares/auth.middleware.ts";

const router = Router();

router.get("/get",authMiddleware, getAllNotifications);
router.delete("/delete-all",authMiddleware, deleteAllNotification);
router.delete("/delete/:notificationId",authMiddleware, deleteNotification);
router.patch("/markAllNotification",authMiddleware, markAllNotification);

export default router;