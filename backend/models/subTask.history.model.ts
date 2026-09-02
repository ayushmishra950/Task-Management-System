import mongoose from "mongoose";

interface ISubTaskAssignmentHistory {
    subTaskId: mongoose.Types.ObjectId;
    taskId: mongoose.Types.ObjectId;
    companyId: mongoose.Types.ObjectId;
    fromEmployeeId: mongoose.Types.ObjectId;
    toEmployeeId: mongoose.Types.ObjectId;
    reassignedBy: mongoose.Types.ObjectId;
    reason?: string;
    reassignedAt: Date;
}

const subTaskAssignmentHistorySchema = new mongoose.Schema<ISubTaskAssignmentHistory>({
            subTaskId: { type: mongoose.Schema.Types.ObjectId, ref: "SubTask", required: true},
            taskId: { type: mongoose.Schema.Types.ObjectId, ref: "Task", required: true},
            companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true},
            fromEmployeeId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true},
            toEmployeeId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true},
            reassignedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true},
            reason: { type: String},
            reassignedAt: { type: Date, default: Date.now},
        }, { timestamps: true });

subTaskAssignmentHistorySchema.index({ companyId: 1, subTaskId: 1});

subTaskAssignmentHistorySchema.index({ companyId: 1, fromEmployeeId: 1});

subTaskAssignmentHistorySchema.index({ companyId: 1, toEmployeeId: 1});

const SubTaskAssignmentHistory = mongoose.model<ISubTaskAssignmentHistory>( "SubTaskAssignmentHistory", subTaskAssignmentHistorySchema);

export default SubTaskAssignmentHistory;
