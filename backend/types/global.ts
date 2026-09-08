
 export type  priorityTypes = "low" | "medium" | "high" | "urgent";

 export type  statusTypes = "pending" | "in_progress" | "completed" | "cancelled";

 export type employeeTypes = "parmanent" | "intern" | "contract";


 export type employeeStatusTypes = "ACTIVE" | "RELIEVED" | "ON_HOLD";



 export type notificationType = | "project_created" | "project_updated" | "project_deleted" | "task_created" | "task_updated" | "task_deleted" | "subtask_created" | "subtask_updated" | "subtask_deleted" | "client_request_created" | "client_request_updated" | "client_request_deleted" | "client_request_reviewed" | "project_assigned" | "project_unassigned";

export type notificationEntityType = | "Project" | "Task" | "SubTask" | "ClientRequest";


 export type clientRequestType = "new_project" | "project_update";

 export type clientRequestStatusTypes = "pending" | "in_review" | "approved" | "rejected" | "completed";
