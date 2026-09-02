
import mongoose from "mongoose";
import { getIO } from "../config/socketInit.ts";
import Notification from "../models/notification.model.ts";
import type { notificationType, notificationEntityType} from "../types/global.ts";


export const deleteProjectSocket = async ({ user, tasks, subTasks}: any) => {
  try {
    const io = getIO();

    const notifications: any[] = [];

    await Promise.all(tasks.filter((task: any) => task.managerId).map(async (task: any) => {
          const managerId = task.managerId.toString();
          const notification = await Notification.create({
            companyId: new mongoose.Types.ObjectId(user.companyId),
            recipientId: new mongoose.Types.ObjectId(managerId),
            createdBy: new mongoose.Types.ObjectId(user.id),
            type: "task_deleted" as notificationType,
            entityType: "Task" as notificationEntityType,
            entityId: new mongoose.Types.ObjectId(task._id),
            title: "Task Deleted",
            message: `The task "${task.name}" has been deleted because its project was deleted.`,
            isRead: false,
          });

          io.to(managerId).emit("notification", notification);

          notifications.push(notification);
        })
    );

    await Promise.all(subTasks.filter((subTask: any) => subTask.employeeId).map(async (subTask: any) => {
          const employeeId = subTask.employeeId.toString();
          const notification = await Notification.create({
            companyId: new mongoose.Types.ObjectId(user.companyId),
            recipientId: new mongoose.Types.ObjectId(employeeId),
            createdBy: new mongoose.Types.ObjectId(user.id),
            type: "subtask_deleted" as notificationType,
            entityType: "SubTask" as notificationEntityType,
            entityId: new mongoose.Types.ObjectId(subTask._id),
            title: "SubTask Deleted",
            message: `The subtask "${subTask.name}" has been deleted because its project was deleted.`,
            isRead: false,
          });

          io.to(employeeId).emit("notification", notification);

          notifications.push(notification);
        })
    );

    console.log(`🔔 Project deletion notifications sent. Tasks: ${tasks.length}, SubTasks: ${subTasks.length}`);

    return {success: true,notifications};

  } catch (error: any) {
    console.error("deleteProjectSocket Error:-",error?.message);
    return {success: false,message:error?.message ||"Something went wrong while creating project deletion notifications."};
  }
};
