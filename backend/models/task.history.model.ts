import mongoose from "mongoose";

interface ITaskAssignmentHistory {
    taskId: mongoose.Types.ObjectId;
    projectId: mongoose.Types.ObjectId;
    companyId: mongoose.Types.ObjectId;
    fromManagerId: mongoose.Types.ObjectId;
    toManagerId: mongoose.Types.ObjectId;
    reassignedBy: mongoose.Types.ObjectId;
    reason?: string;
    reassignedAt: Date;
}

const taskAssignmentHistorySchema = new mongoose.Schema<ITaskAssignmentHistory>({
            taskId: { type: mongoose.Schema.Types.ObjectId, ref: "Task", required: true},
            projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true},
            companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true},
            fromManagerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true},
            toManagerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true},
            reassignedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true},
            reason: { type: String},
            reassignedAt: { type: Date, default: Date.now},
        }, {timestamps: true});

taskAssignmentHistorySchema.index({ companyId: 1, taskId: 1});

taskAssignmentHistorySchema.index({ companyId: 1, fromManagerId: 1, reassignedAt: -1});

taskAssignmentHistorySchema.index({ companyId: 1, toManagerId: 1, reassignedAt: -1});

const TaskAssignmentHistory = mongoose.model<ITaskAssignmentHistory>( "TaskAssignmentHistory", taskAssignmentHistorySchema);

export default TaskAssignmentHistory;
