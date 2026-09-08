import mongoose from "mongoose";
import type { priorityTypes, clientRequestType, clientRequestStatusTypes } from "../types/global.ts";

export interface IClientRequest {
    companyId: mongoose.Types.ObjectId;
    clientId: mongoose.Types.ObjectId;
    requestType: clientRequestType;
    projectId?: mongoose.Types.ObjectId;
    title: string;
    description: string;
    priority: priorityTypes;
    expectedDate?: Date;
    referenceUrl?: string;
    status: clientRequestStatusTypes;
    adminRemarks?: string;
    reviewedBy?: mongoose.Types.ObjectId;
    reviewedAt?: Date;
    linkedProjectId?: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const clientRequestSchema = new mongoose.Schema<IClientRequest>({
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    requestType: { type: String, enum: ["new_project", "project_update"], required: true },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    priority: { type: String, enum: ["low", "medium", "high", "urgent"], default: "medium" },
    expectedDate: { type: Date },
    referenceUrl: { type: String },
    status: { type: String, enum: ["pending", "in_review", "approved", "rejected", "completed"], default: "pending" },
    adminRemarks: { type: String },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewedAt: { type: Date },
    linkedProjectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
}, { timestamps: true });

clientRequestSchema.index({ companyId: 1, status: 1, createdAt: -1 });
clientRequestSchema.index({ companyId: 1, clientId: 1, createdAt: -1 });

const ClientRequest = mongoose.model<IClientRequest>("ClientRequest", clientRequestSchema);

export default ClientRequest;
