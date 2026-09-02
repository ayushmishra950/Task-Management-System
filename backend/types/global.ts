
 export type  priorityTypes = "low" | "medium" | "high" | "urgent";

 export type  statusTypes = "pending" | "in_progress" | "completed" | "cancelled";

 export type employeeTypes = "parmanent" | "intern" | "contract";


 export type employeeStatusTypes = "ACTIVE" | "RELIEVED" | "ON_HOLD";



 export type notificationType = | "project_created" | "project_updated" | "project_deleted" | "task_created" | "task_updated" | "task_deleted" | "subtask_created" | "subtask_updated" | "subtask_deleted";

export type notificationEntityType = | "Project" | "Task" | "SubTask";
