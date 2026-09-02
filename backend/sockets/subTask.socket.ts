import mongoose from "mongoose";
import { getIO } from "../config/socketInit.ts";
import Notification from "../models/notification.model.ts";
import type { notificationType, notificationEntityType} from "../types/global.ts";
import User from "../models/user.model.ts";

// ==================== CREATE SUBTASK ====================

export const createSubTaskSocket = async ({ user, employeeId, subTask}: any) => {
    try {
        const io = getIO();

        const notification = await Notification.create({
            companyId: new mongoose.Types.ObjectId(user.companyId!),
            recipientId: new mongoose.Types.ObjectId(employeeId),
            createdBy: new mongoose.Types.ObjectId(user.id),
            type: "subtask_created" as notificationType,
            entityType: "SubTask" as notificationEntityType,
            entityId: new mongoose.Types.ObjectId(subTask._id),
            title: "New SubTask Created",
            message: `A new subtask "${subTask.name}" has been created and assigned to you for completion.`,
            isRead: false,
        });

        io.to(employeeId.toString()).emit("notification", notification);

        console.log(`🔔 SubTask notification sent to employee: ${employeeId}`);

        return { success: true, notification};

    } catch (error: any) {
        console.error("createSubTaskSocket Error:-", error?.message);
        return { success: false, message: error?.message || "Something went wrong while creating subtask notification."};
    }
};


// ==================== UPDATE SUBTASK ====================

export const updateSubTaskSocket = async ({ user, employeeId, subTask}: any) => {
    try {
        const io = getIO();

        const notification = await Notification.create({
            companyId: new mongoose.Types.ObjectId(user.companyId!),
            recipientId: new mongoose.Types.ObjectId(employeeId),
            createdBy: new mongoose.Types.ObjectId(user.id),
            type: "subtask_updated" as notificationType,
            entityType: "SubTask" as notificationEntityType,
            entityId: new mongoose.Types.ObjectId(subTask._id),
            title: "SubTask Updated",
            message: `The subtask "${subTask.name}" has been updated successfully.`,
            isRead: false,
        });

        io.to(employeeId.toString()).emit("notification", notification);

        console.log( `🔔 SubTask update notification sent to employee: ${employeeId}`);

        return { success: true, notification};

    } catch (error: any) {
        console.error( "updateSubTaskSocket Error:-", error?.message);
        return { success: false, message: error?.message || "Something went wrong while creating subtask update notification."};
    }
};


// ==================== DELETE SUBTASK ====================

export const deleteSubTaskSocket = async ({ user, employeeId, subTask}: any) => {
    try {
        const io = getIO();

        const notification = await Notification.create({
            companyId: new mongoose.Types.ObjectId(user.companyId!),
            recipientId: new mongoose.Types.ObjectId(employeeId),
            createdBy: new mongoose.Types.ObjectId(user.id),
            type: "subtask_deleted" as notificationType,
            entityType: "SubTask" as notificationEntityType,
            entityId: new mongoose.Types.ObjectId(subTask._id),
            title: "SubTask Deleted",
            message: `The subtask "${subTask.name}" has been deleted.`,
            isRead: false,
        });

        io.to(employeeId.toString()).emit("notification", notification);

        console.log( `🔔 SubTask deletion notification sent to employee: ${employeeId}`);

        return { success: true, notification};

    } catch (error: any) {
        console.error( "deleteSubTaskSocket Error:-", error?.message);
        return { success: false, message: error?.message || "Something went wrong while creating subtask deletion notification."};
    }
};









// ==================== SUBTASK STATUS UPDATE ====================

export const updateSubTaskStatusSocket = async ({ user, employeeId, subTask}: any) => {
    try {
        const io = getIO();

        if (!user?.id || !user?.role || !user?.companyId || !subTask?._id) return { success: false, message: "Required information is missing."};

    let recipientId: string;

    if (user.role === "employee")  recipientId = subTask.createdBy.toString();

    else if (user.role === "admin" || user.role === "manager") recipientId = employeeId.toString();

    else return { success: false, message: "Invalid user role."};


    if (recipientId === user.id.toString()) return { success: true, message: "Status updated. No notification required for current user."};

        const notification = await Notification.create({
            companyId: new mongoose.Types.ObjectId(user.companyId!),
            recipientId: new mongoose.Types.ObjectId(recipientId),
            createdBy: new mongoose.Types.ObjectId(user.id),
            type: "subtask_updated" as notificationType,
            entityType: "SubTask" as notificationEntityType,
            entityId: new mongoose.Types.ObjectId(subTask._id),
            title: "SubTask Status Updated",
            message: `The status of subtask "${subTask.name}" has been updated to "${subTask.status}".`,
            isRead: false,
        });

        io.to(recipientId.toString()).emit("notification", notification);

        console.log( `🔔 SubTask status update notification sent to employee: ${recipientId}`);

        return {success: true, notification};

    } catch (error: any) {
        console.error( "updateSubTaskStatusSocket Error:-", error?.message);
        return { success: false, message: error?.message || "Something went wrong while creating subtask status update notification."};
    }
};








// ==================== REASSIGN SUBTASK ====================

export const reassignSubTaskSocket = async ({ user, fromEmployeeId, toEmployeeId, subTask}: any) => {
    try {
        const io = getIO();
        const toEmployee = await User.findById(toEmployeeId);

        const oldEmployeeNotification = await Notification.create({
            companyId: new mongoose.Types.ObjectId(user.companyId!),
            recipientId: new mongoose.Types.ObjectId(fromEmployeeId),
            createdBy: new mongoose.Types.ObjectId(user.id),
            type: "subtask_updated" as notificationType,
            entityType: "SubTask" as notificationEntityType,
            entityId: new mongoose.Types.ObjectId(subTask._id),
            title: "SubTask Reassigned",
            message: `The subtask "${subTask.name}" has been reassigned to another employee name ${toEmployee?.fullName} role ${toEmployee?.role}.`,
            isRead: false,
        });

        const newEmployeeNotification = await Notification.create({
            companyId: new mongoose.Types.ObjectId(user.companyId!),
            recipientId: new mongoose.Types.ObjectId(toEmployeeId),
            createdBy: new mongoose.Types.ObjectId(user.id),
            type: "subtask_updated" as notificationType,
            entityType: "SubTask" as notificationEntityType,
            entityId: new mongoose.Types.ObjectId(subTask._id),
            title: "New SubTask Assigned",
            message: `The subtask "${subTask.name}" has been assigned to you.`,
            isRead: false,
        });

        io.to(fromEmployeeId.toString()).emit("notification", oldEmployeeNotification);

        io.to(toEmployeeId.toString()).emit("notification", newEmployeeNotification);

        console.log(`🔄 SubTask reassignment notification sent. From: ${fromEmployeeId} → To: ${toEmployeeId}`);

        return { success: true, notifications: { oldEmployee: oldEmployeeNotification, newEmployee: newEmployeeNotification }};

    } catch (error: any) {
        console.error( "reassignSubTaskSocket Error:-", error?.message);
        return { success: false, message: error?.message || "Something went wrong while creating reassignment notifications."};
    }
};

