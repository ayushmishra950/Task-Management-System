import mongoose from "mongoose";
import type { notificationType, notificationEntityType } from "../types/global.ts";

export interface INotification {
    companyId: mongoose.Types.ObjectId;
    recipientId: mongoose.Types.ObjectId;
    createdBy: mongoose.Types.ObjectId;
    type: notificationType;
    entityType: notificationEntityType;
    entityId: mongoose.Types.ObjectId;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const notificationSchema = new mongoose.Schema<INotification>(
    {
        companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true, index: true},
        recipientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true},
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true},
        type: { type: String, enum: [ "project_created", "project_updated", "project_deleted","task_created", "task_updated", "task_deleted","subtask_created", "subtask_updated", "subtask_deleted"],  required: true},
        entityType: { type: String, enum: ["Project", "Task", "SubTask"], required: true},
        entityId: { type: mongoose.Schema.Types.ObjectId, required: true},
        title: { type: String, required: true, trim: true},
        message: { type: String, required: true, trim: true},
        isRead: {type: Boolean,default: false},
    },{ timestamps: true});

notificationSchema.index({ companyId: 1, recipientId: 1, createdAt: -1});

notificationSchema.index({ companyId: 1, entityType: 1, entityId: 1});

notificationSchema.index({ companyId: 1, recipientId: 1, isRead: 1, createdAt: -1});

const Notification = mongoose.model<INotification>("Notification", notificationSchema);

export default Notification;
