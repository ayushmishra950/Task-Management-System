import Project from "../models/project.model.ts";
import TaskAssignmentHistory from "../models/task.history.model.ts";
import SubTaskAssignmentHistory from "../models/subTask.history.model.ts";
import Task from "../models/task.model.ts";
import SubTask from "../models/subTask.model.ts";
import mongoose from "mongoose";
import {deleteProjectSocket} from "../sockets/project.socket.ts";


export const handleDeleteProject = async ({user,projectIds,companyId}: {user:any;projectIds: string[];companyId: string}) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    
    const projects = await Project.find({_id: { $in: projectIds },companyId}).select("_id").session(session);

    if (!projects.length) {
      await session.abortTransaction();
      return {success: false,message: "No matching projects found."};
    }

    const matchedProjectIds = projects.map((project) => project._id);

    const tasks = await Task.find({ projectId: { $in: matchedProjectIds }, companyId}).select("_id fullName managerId").session(session);

    const taskIds = tasks.map((task) => task._id);
  
    let subTasks: any[] = [];

     if(taskIds?.length > 0){
     subTasks = await SubTask.find({taskId: {$in: taskIds}, companyId}).select("_id fullname taskId employeeId").session(session);
     }

    let deletedSubTasks = 0;

    if (taskIds.length > 0) {
      const subTaskDeleteResult = await SubTask.deleteMany({ taskId: { $in: taskIds }, companyId}, {session});

       deletedSubTasks = subTaskDeleteResult.deletedCount}

    const taskDeleteResult = await Task.deleteMany({projectId: { $in: matchedProjectIds },companyId}, { session });

    const projectDeleteResult = await Project.deleteMany({_id: { $in: matchedProjectIds }, companyId},{ session });

    // 7. Commit transaction
    await session.commitTransaction();

    if (tasks.length > 0 || subTasks.length > 0) {
      await deleteProjectSocket({ user, tasks, subTasks});
    }

    return {success: true,message: "Projects, tasks and subtasks deleted successfully.",data: {deletedProjects: projectDeleteResult.deletedCount,deletedTasks: taskDeleteResult.deletedCount,deletedSubTasks}};

  } catch (error: any) {
    await session.abortTransaction();
    console.error("Delete Project Error:", error);
    return {success: false,message: error?.message || "Something went wrong."};
  }
   finally {
    await session.endSession();
  }
};


export const getProjectByIdData = async ({ projectId, companyId}: any) => {
  try {
    if (!projectId) return { success: false, message: "Project ID is required."};

    if (!companyId) return { success: false, message: "Company ID is required."};

    if (!mongoose.Types.ObjectId.isValid(projectId)) return { success: false, message: "Invalid Project ID."};

    if (!mongoose.Types.ObjectId.isValid(companyId)) return { success: false, message: "Invalid Company ID."}

  
    const project = await Project.findOne({ _id: projectId, companyId: companyId})
      .populate({ path: "createdBy", select: "fullName email profileImage"}).lean();

    if (!project) return {success: false,message: "Project not found."};

    const tasks = await Task.find({projectId: projectId,companyId: companyId})
      .populate({path: "managerId",select: "fullName email profileImage role department", populate: {path: "department",select: "name"}})
      .populate({path: "createdBy",select: "fullName email profileImage role"})
      .lean();

    const taskIds = tasks.map((task) => task._id);

    const subTasks = taskIds.length ? await SubTask.find({taskId: { $in: taskIds },companyId: companyId})
          .populate({path: "employeeId",select: "fullName email profileImage role department",populate: {path: "department",select: "name"}})
          .populate({path: "createdBy",select: "fullName email profileImage role department",populate: {path: "department",select: "name"} })
          .lean()
      : [];

    return {
      success: true,
      message: "Project data fetched successfully.",
      data: { project, tasks, subTasks},
    };
  } catch (error: any) {
    console.error("Get Project By ID Error:", error);
    return { success: false, message: error?.message || "Something went wrong."};
  }
};


export const reassignmentHistory = async ({ user }: any) => {
    try {
        const userId = user?.id;
        const companyId = user?.companyId;
        const role = user?.role;

        if (!userId || !role) return { success: false, message: "User information is missing."};

        let taskHistory: any[] = [];
        let subTaskHistory: any[] = [];

        if (role === "admin") {
            taskHistory = await TaskAssignmentHistory.find({ companyId }).populate("taskId", "name")
                .populate("projectId", "name").populate("fromManagerId", "fullName email role").populate("toManagerId", "fullName email role")
                .populate("reassignedBy", "fullName email role").sort({ reassignedAt: -1 }).lean();

            subTaskHistory = await SubTaskAssignmentHistory.find({ companyId }).populate("subTaskId", "name")
                .populate("taskId", "name").populate("fromEmployeeId", "fullName email role").populate("toEmployeeId", "fullName email role")
                .populate("reassignedBy", "fullName email role").sort({ reassignedAt: -1 }).lean();
        }


        if (role === "manager") {

            const taskHistoryFrom = await TaskAssignmentHistory.find({ companyId,fromManagerId: userId})
                .populate("taskId", "name").populate("projectId", "name")
                .populate("fromManagerId", "fullName email role").populate("toManagerId", "fullName email role")
                .populate("reassignedBy", "fullName email role").sort({ reassignedAt: -1 }).lean();

            const taskHistoryTo = await TaskAssignmentHistory
                .find({ companyId, toManagerId: userId})
                .populate("taskId", "name").populate("projectId", "name")
                .populate("fromManagerId", "fullName email role").populate("toManagerId", "fullName email role")
                .populate("reassignedBy", "fullName email role").sort({ reassignedAt: -1 }).lean();

         
            taskHistory = [ ...taskHistoryFrom, ...taskHistoryTo];

            subTaskHistory = await SubTaskAssignmentHistory.find({ companyId, reassignedBy: userId,})
                .populate("subTaskId", "name").populate("taskId", "name")
                .populate("fromEmployeeId", "fullName email role").populate("toEmployeeId", "fullName email role")
                .populate("reassignedBy", "fullName email role").sort({ reassignedAt: -1 }).lean();
        }

      
        if (role === "employee") {
            subTaskHistory = await SubTaskAssignmentHistory.find({ companyId, fromEmployeeId: userId,})
                .populate("subTaskId", "name").populate("taskId", "name")
                .populate("fromEmployeeId", "fullName email role").populate("toEmployeeId", "fullName email role")
                .populate("reassignedBy", "fullName email role").sort({ reassignedAt: -1 }).lean();
        }

        const formattedTaskHistory = taskHistory.map((history) => ({
            id: history._id,
            type: "task",

            project: history.projectId ? { id: history.projectId._id, name: history.projectId.name,} : null,

            task: history.taskId ? {id: history.taskId._id,name: history.taskId.name,}: null,

            fromUser: history.fromManagerId 
              ? { id: history.fromManagerId._id, name: history.fromManagerId.fullName, email: history.fromManagerId.email, role: "manager"}
                : null,

            toUser: history.toManagerId
                ? { id: history.toManagerId._id, name: history.toManagerId.fullName, email: history.toManagerId.email, role: "manager"}
                   : null,

            reassignedBy: history.reassignedBy
                ? { id: history.reassignedBy._id, name: history.reassignedBy.fullName, email: history.reassignedBy.email, role: history.reassignedBy.role}
                : null,

            reason: history.reason,
            reassignedAt: history.reassignedAt,
        }));

        const formattedSubTaskHistory = subTaskHistory.map((history) => ({
            id: history._id,
            type: "subtask",
            project: null,
            task: history.taskId ? { id: history.taskId._id, name: history.taskId.name}: null,

            subTask: history.subTaskId ? { id: history.subTaskId._id, name: history.subTaskId.name,} : null,

            fromUser: history.fromEmployeeId
                ? { id: history.fromEmployeeId._id, name: history.fromEmployeeId.fullName, email: history.fromEmployeeId.email, role: "employee"}
                : null,

            toUser: history.toEmployeeId
                ? { id: history.toEmployeeId._id, name: history.toEmployeeId.fullName, email: history.toEmployeeId.email, role: "employee"}
                : null,

            reassignedBy: history.reassignedBy
                ? { id: history.reassignedBy._id, name: history.reassignedBy.fullName, email: history.reassignedBy.email, role: history.reassignedBy.role}
                : null,

            reason: history.reason,
            reassignedAt: history.reassignedAt,
        }));

     
        const history = [ ...formattedTaskHistory, ...formattedSubTaskHistory].sort(
            (a, b) => new Date(b.reassignedAt).getTime() - new Date(a.reassignedAt).getTime());

        if (!history.length) return { success: false, message: "Assignment history not found."};

        return { success: true, data: history};

    } catch (error: any) {
        console.error("Assignment History Error:", error);

        return { success: false, message: error?.message || "Something went wrong."};
    }
};











export const completedStatusAssignment = async ({ user }: any) => {
    try {
        const userId = user?.id;
        const companyId = user?.companyId;
        const role = user?.role;

        if (!userId || !companyId || !role) return { success: false, message: "User information is missing."};

        let projects: any[] = [];
        let tasks: any[] = [];
        let subTasks: any[] = [];

     
        if (role === "admin") {
            projects = await Project.find({ companyId, status: "completed"})
                .populate("createdBy", "fullName email role").sort({ updatedAt: -1 }).lean();

            tasks = await Task.find({ companyId, status: "completed"})
                .populate("projectId", "name").populate("managerId", "fullName email")
                .populate("createdBy", "fullName email role").sort({ updatedAt: -1 }).lean();

            subTasks = await SubTask.find({ companyId, status: "completed"})
                .populate("taskId", "name").populate("employeeId", "fullName email role")
                .populate("createdBy", "fullName email role").sort({ updatedAt: -1 }).lean();
        }

     
        if (role === "manager") {
            tasks = await Task.find({ companyId, managerId: userId, status: "completed"})
                .populate("projectId", "name").populate("managerId", "fullName email")
                .populate("createdBy", "fullName email role").sort({ updatedAt: -1 }).lean();

            const managerTaskIds = tasks.map((task) => task._id);

            if (managerTaskIds.length > 0) {
                subTasks = await SubTask.find({ companyId, taskId: { $in: managerTaskIds }, status: "completed"})
                    .populate("taskId", "name").populate("employeeId", "fullName email role")
                    .populate("createdBy", "fullName email role").sort({ updatedAt: -1 }).lean();
            }
        }

        // ==========================================
        // EMPLOYEE
        // ==========================================
        if (role === "employee") {
            subTasks = await SubTask.find({ companyId, employeeId: userId, status: "completed",})
                .populate("taskId", "name").populate("employeeId", "fullName email role")
                .populate("createdBy", "fullName email role").sort({ updatedAt: -1 }).lean();
        }

     
        const formattedProjects = projects.map((project) => ({
            id: project._id,
            type: "project",
            project: { id: project._id, name: project.name},
            task: null,
            subTask: null,
            createdBy: project.createdBy ? { id: project.createdBy._id, name: project.createdBy.fullName, email: project.createdBy.email, role: project.createdBy.role } : null,
            status: project.status,
            completedAt: project.updatedAt,
        }));

        const formattedTasks = tasks.map((task) => ({
            id: task._id,
            type: "task",
            project: task.projectId ? { id: task.projectId._id, name: task.projectId.name} : null,
            task: { id: task._id, name: task.name},
            subTask: null,
            manager: task.managerId ? { id: task.managerId._id, name: task.managerId.fullName, email: task.managerId.email, role: task.managerId.role } : null,
            createdBy: task.createdBy ? {id: task.createdBy._id, name: task.createdBy.fullName, email: task.createdBy.email, role: task.createdBy.role } : null,
            status: task.status,
            completedAt: task.updatedAt,
        }));

        const formattedSubTasks = subTasks.map((subTask) => ({
            id: subTask._id,
            type: "subtask",
            project: null,
            task: subTask.taskId ? { id: subTask.taskId._id, name: subTask.taskId.name,} : null,
            subTask: { id: subTask._id, name: subTask.name},
            employee: subTask.employeeId ? {id: subTask.employeeId._id, name: subTask.employeeId.fullName, email: subTask.employeeId.email, role: subTask.employeeId.role } : null,
            createdBy: subTask.createdBy ? {id: subTask.createdBy._id, name: subTask.createdBy.fullName, email: subTask.createdBy.email, role: subTask.createdBy.role } : null,
            status: subTask.status,
            completedAt: subTask.updatedAt,
        }));

     
        const completedItems = [ ...formattedProjects, ...formattedTasks, ...formattedSubTasks,
        ].sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());

        if (!completedItems.length) return { success: false, message: "Completed tasks not found."};

        return { success: true, data: completedItems};
    } catch (error: any) {
        console.error("Completed Status Assignment Error:", error);

        return { success: false, message: error?.message || "Something went wrong."};
    }
};











export const handleGetDashboardData = async ({ user }: any) => {
  try {
    if (!user?.id || !user?.role || !user?.companyId) return { success: false, message: "User information is required."};

    const { id, role, companyId } = user;

    if (role === "admin") {
      const [projects, tasks] = await Promise.all([
        Project.find({ companyId}).sort({ createdAt: -1 }).limit(5).lean(),

        Task.find({ companyId}).sort({ createdAt: -1 })
        .populate("createdBy", "fullName role email")
        .populate("managerId", "fullName role email")
        .limit(5).lean(),
      ]);

      return { success: true, data: {projects,tasks }};
    }

    if (role === "manager") {
      const [tasks, subTasks] = await Promise.all([
        Task.find({companyId,managerId: id}).sort({ createdAt: -1 })
        .populate("createdBy", "fullName role email")
        .populate("managerId", "fullName role email")
        .limit(5).lean(),

        SubTask.find({ companyId, createdBy: id}).sort({ createdAt: -1 })
        .populate("createdBy", "fullName role email")
        .populate("employeeId", "fullName role email")
        .limit(5).lean(),
      ]);

      return { success: true, data: { tasks, subTasks}};
    }

    if (role === "employee") {
      const subTasks = await SubTask.find({ companyId, employeeId: id}).sort({ createdAt: -1 })
        .populate("createdBy", "fullName role email")
        .populate("employeeId", "fullName role email")
        .limit(5).lean();

      return { success: true, data: {subTasks}};
    }


    return { success: false, message: "Invalid user role."};
  } catch (error: any) {
    console.error("Get Dashboard Data Error:", error);

    return { success: false, message: error?.message || "Something went wrong."};
  }
};






export const handleGetDashboardSummary = async ({ user }: any) => {
  try {
    if (!user?.id || !user?.role || !user?.companyId) return { success: false, message: "User information is required."};

    const { id, role, companyId } = user;

    const now = new Date();

    const currentMonthStart = new Date( now.getFullYear(), now.getMonth(), 1);

    const nextMonthStart = new Date( now.getFullYear(), now.getMonth() + 1, 1);

   
    if (role === "admin") {
      const [ totalProjects, currentMonthProjects, completedProjects,
 totalTasks, currentMonthTasks, completedTasks, pendingTasks, inProgressTasks,
      ] = await Promise.all([
        // Total Projects
        Project.countDocuments({ companyId}),

        // Current Month Projects
        Project.countDocuments({ companyId, createdAt: {$gte: currentMonthStart,$lt: nextMonthStart},
        }),

        // Completed Projects
        Project.countDocuments({ companyId, status: "completed"}),

        // Total Tasks
        Task.countDocuments({ companyId }),

        // Current Month Tasks
        Task.countDocuments({ companyId, createdAt: {$gte: currentMonthStart,$lt: nextMonthStart },
        }),

        // Completed Tasks
        Task.countDocuments({ companyId, status: "completed"}),

        // Pending Tasks
        Task.countDocuments({ companyId, status: "pending",
        }),

        // In Progress Tasks
        Task.countDocuments({ companyId, status: "in_progress"}),
      ]);

      return {
        success: true,
        data: { totalProjects, currentMonthProjects, completedProjects,
 totalTasks, currentMonthTasks, completedTasks, pendingTasks, inProgressTasks,
        },
      };
    }

    // =========================
    // MANAGER
    // =========================
    if (role === "manager") {
      const [ totalTasks, completedTasks, totalSubTasks, completedSubTasks, pendingSubTasks, inProgressSubTasks,
      ] = await Promise.all([
        // Tasks assigned to manager
        Task.countDocuments({ companyId, managerId: id}),

        // Completed Tasks assigned to manager
        Task.countDocuments({ companyId, managerId: id, status: "completed"}),

        // SubTasks created by manager
        SubTask.countDocuments({ companyId, createdBy: id}),

        // Completed SubTasks created by manager
        SubTask.countDocuments({ companyId, createdBy: id, status: "completed"}),

        // Pending SubTasks created by manager
        SubTask.countDocuments({ companyId, createdBy: id, status: "pending"}),

        // In Progress SubTasks created by manager
        SubTask.countDocuments({ companyId, createdBy: id, status: "in_progress"}),
      ]);

      return {
        success: true,
        data: { totalTasks, completedTasks, totalSubTasks, completedSubTasks, pendingSubTasks, inProgressSubTasks },
      };
    }

    // =========================
    // EMPLOYEE
    // =========================
    if (role === "employee") {
      const [ totalSubTasks, completedSubTasks, pendingSubTasks, inProgressSubTasks] = await Promise.all([
        // SubTasks assigned to employee
        SubTask.countDocuments({ companyId, employeeId: id}),

        // Completed SubTasks
        SubTask.countDocuments({ companyId, employeeId: id, status: "completed"}),

        // Pending SubTasks
        SubTask.countDocuments({ companyId, employeeId: id, status: "pending"}),

        // In Progress SubTasks
        SubTask.countDocuments({ companyId, employeeId: id, status: "in_progress"}),
      ]);

      return {
        success: true,
        data: { totalSubTasks, completedSubTasks, pendingSubTasks, inProgressSubTasks },
      };
    }

    // =========================
    // INVALID / UNKNOWN ROLE
    // =========================
    return { success: false, message: "Invalid user role."};
  } catch (error: any) {
    console.error("Get Dashboard Summary Error:", error);

    return { success: false, message: error?.message || "Something went wrong."};
  }
};
