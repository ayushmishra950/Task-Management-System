import mongoose from "mongoose";
import { getIO } from "../config/socketInit.ts";
import Notification from "../models/notification.model.ts";
import type { notificationType, notificationEntityType} from "../types/global.ts";


export const createTaskSocket = async ({ user, managerId, task}: any) => {
    try {
        const io = getIO();

        const notification = await Notification.create({
            companyId: new mongoose.Types.ObjectId(user.companyId!),
            recipientId: new mongoose.Types.ObjectId(managerId),
            createdBy: new mongoose.Types.ObjectId(user.id),
            type: "task_created" as notificationType,
            entityType: "Task" as notificationEntityType,
            entityId: new mongoose.Types.ObjectId(task._id),
            title: "New Task Created",
            message: `A new task "${task.name}" has been created and assigned for your review.`,
            isRead: false,
        });


        io.to(managerId.toString()).emit("notification", notification);

        console.log(`🔔 Task notification sent to manager: ${managerId}`);

        return {success: true,notification};

    } catch (error: any) {
        console.error( "createTaskSocket Error:-", error?.message);
        return { success: false, message: error?.message || "Something went wrong while creating notification."};
    }
};







export const updateTaskSocket = async ({ user, managerId, task }: any) => {
    try {
        const io = getIO();

        const notification = await Notification.create({
            companyId: new mongoose.Types.ObjectId(user.companyId!),
            recipientId: new mongoose.Types.ObjectId(managerId),
            createdBy: new mongoose.Types.ObjectId(user.id),
            type: "task_updated" as notificationType,
            entityType: "Task" as notificationEntityType,
            entityId: new mongoose.Types.ObjectId(task._id),
            title: "Task Updated",
            message: `The task "${task.name}" has been updated successfully.`,
            isRead: false,
        });

        io.to(managerId.toString()).emit("notification", notification);

        console.log(`🔔 Task update notification sent to manager: ${managerId}`);
        return { success: true, notification};

    } catch (error: any) {
        console.error( "updateTaskSocket Error:-", error?.message);
        return { success: false, message: error?.message || "Something went wrong while creating task update notification."};
    }
};




export const deleteTaskSocket = async ({ user, task, subTasks}: any) => {
  try {
    const io = getIO();

    const notifications = [];

    const managerId = task.managerId;

    if (managerId) {
      const managerNotification = await Notification.create({
        companyId: new mongoose.Types.ObjectId(user.companyId),
        recipientId: new mongoose.Types.ObjectId(managerId),
        createdBy: new mongoose.Types.ObjectId(user.id),
        type: "task_deleted" as notificationType,
        entityType: "Task" as notificationEntityType,
        entityId: new mongoose.Types.ObjectId(task._id),
        title: "Task Deleted",
        message: `The task "${task.name}" has been deleted.`,
        isRead: false,
      });

      io.to(managerId.toString()).emit("notification", managerNotification);

      notifications.push(managerNotification);
    }

    const employeeIds: string[] = [...new Set<string>( subTasks.filter((subTask: any) => subTask.employeeId).map((subTask: any) => subTask.employeeId.toString()))];

    await Promise.all(
      employeeIds.map(async (employeeId: string) => {

        const employeeNotification = await Notification.create({
          companyId: new mongoose.Types.ObjectId(user.companyId),
          recipientId: new mongoose.Types.ObjectId(employeeId),
          createdBy: new mongoose.Types.ObjectId(user.id),
          type: "subtask_deleted" as notificationType,
          entityType: "SubTask" as notificationEntityType,
          entityId: new mongoose.Types.ObjectId(task._id),
          title: "SubTasks Deleted",
          message: `The subtask associated with task "${task.name}" has been deleted.`,
          isRead: false,
        });

        io.to(employeeId).emit("notification", employeeNotification);

        notifications.push(employeeNotification);
      })
    );

    console.log(`🔔 Task deletion notification sent. Manager: ${managerId}, Employees: ${employeeIds.join(", ")}`);

    return {success: true,notifications};

  } catch (error: any) {
    console.error("deleteTaskSocket Error:-",error?.message);
    return {success: false,message:error?.message ||"Something went wrong while creating task deletion notifications."
    };
  }
};






// ==================== TASK STATUS UPDATE ====================

export const updateTaskStatusSocket = async ({ user, managerId, task}: any) => {
    try {
        const io = getIO();

        let recipientId: string;

        if (user.role === "manager") recipientId = task.createdBy.toString();

        else if (user.role === "admin") recipientId = managerId.toString();

        else return { success: false, message: "Invalid user role."};


        if (recipientId === user.id.toString()) return { success: true, message: "Status updated. No notification required for current user."};

        const notification = await Notification.create({
            companyId: new mongoose.Types.ObjectId(user.companyId),
            recipientId: new mongoose.Types.ObjectId(recipientId),
            createdBy: new mongoose.Types.ObjectId(user.id),
            type: "task_updated" as notificationType,
            entityType: "Task" as notificationEntityType,
            entityId: new mongoose.Types.ObjectId(task._id),
            title: "Task Status Updated",
            message: `The status of task "${task.name}" has been updated to "${task.status}".`,
            isRead: false,
        });

        io.to(recipientId.toString()).emit("notification", notification);

        console.log( `🔔 Task status update notification sent to user: ${recipientId}`);

        return { success: true, notification};

    } catch (error: any) {
        console.error( "updateTaskStatusSocket Error:-", error?.message);
        return {success: false, message: error?.message || "Something went wrong while creating task status update notification."
        };
    }
};




// ==================== REASSIGN TASK ====================

export const reassignTaskSocket = async ({ user, fromManagerId, toManagerId, task}: any) => {
    try {
        const io = getIO();

        const oldManagerNotification = await Notification.create({
            companyId: new mongoose.Types.ObjectId(user.companyId!),
            recipientId: new mongoose.Types.ObjectId(fromManagerId),
            createdBy: new mongoose.Types.ObjectId(user.id),
            type: "task_updated" as notificationType,
            entityType: "Task" as notificationEntityType,
            entityId: new mongoose.Types.ObjectId(task._id),
            title: "Task Reassigned",
            message: `The task "${task.name}" has been reassigned to another manager.`,
            isRead: false,
        });


        const newManagerNotification = await Notification.create({
            companyId: new mongoose.Types.ObjectId(user.companyId!),
            recipientId: new mongoose.Types.ObjectId(toManagerId),
            createdBy: new mongoose.Types.ObjectId(user.id),
            type: "task_updated" as notificationType,
            entityType: "Task" as notificationEntityType,
            entityId: new mongoose.Types.ObjectId(task._id),
            title: "New Task Assigned",
            message: `The task "${task.name}" has been assigned to you.`,
            isRead: false,
        });

        io.to(fromManagerId.toString()).emit("notification", oldManagerNotification);

        io.to(toManagerId.toString()).emit("notification", newManagerNotification);


        console.log( `🔄 Task reassignment notification sent. From: ${fromManagerId} → To: ${toManagerId}`);

        return { success: true, notifications: { oldManager: oldManagerNotification, newManager: newManagerNotification}};

    } catch (error: any) {
        console.error( "reassignTaskSocket Error:-", error?.message);
        return { success: false, message: error?.message || "Something went wrong while creating task reassignment notifications."};
    }
};
