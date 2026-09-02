import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "@/redux-toolkit/api/session/auth.check";

export const admin_Task_Api = createApi({
  reducerPath: "admin_Task_Api",

  baseQuery: baseQueryWithReauth,
   tagTypes:["Task"],

  endpoints: (builder) => ({
    // CREATE TASK
    createTask: builder.mutation<any, {body:any}>({
      query: ({body}) => ({
        url: "/api/admin/task/create",
        method: "POST",
        body,
      }),
      invalidatesTags:["Task"]
    }),

    // GET ALL TASKS
    getAllTask: builder.query<
      any,
      {
        projectId: string;
        companyId: string;
      }
    >({
      query: ({ projectId, companyId }) => ({
        url: `/api/admin/task/get/${companyId}`,
        method: "GET",
        params: projectId ? {projectId} : undefined
      }),
      providesTags:["Task"]
    }),

    // GET TASK BY ID
    getTaskById: builder.query<
      any,
      {
        id: string;
        companyId: string;
      }
    >({
      query: ({ id, companyId }) => ({
        url: `/api/admin/task/getById/${id}/${companyId}`,
        method: "GET",
      }),
    }),

    // UPDATE TASK
    updateTask: builder.mutation<
      any,
      {
        id: string;
        companyId: string;
        body: any;
      }
    >({
      query: ({ id, companyId, body }) => ({
        url: `/api/admin/task/update/${id}/${companyId}`,
        method: "PUT",
        body,
      }),
      invalidatesTags:["Task"]
    }),

    // UPDATE TASK STATUS
    updateTaskStatus: builder.mutation<
      any,
      {
        id: string;
        companyId: string;
        body: any;
      }
    >({
      query: ({ id, companyId, body }) => ({
        url: `/api/admin/task/update/status/${id}/${companyId}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags:["Task"]
    }),

    // DELETE TASK
    deleteTask: builder.mutation<
      any,
      {
        taskIds: string[];
        companyId: string;
      }
    >({
      query: ({ taskIds, companyId }) => ({
        url: `/api/admin/task/delete/${companyId}`,
        method: "DELETE",
        body:{taskIds}
      }),
      invalidatesTags:["Task"]
    }),

     reassignedTask: builder.mutation<
      any,
      {
        taskId: string;
        newManagerId: string;
        startDate: string;
        endDate: string;
        reason: string;
      }
    >({
      query: ({ taskId, newManagerId, startDate, endDate, reason }) => ({
        url: `/api/admin/task/reassigned/${taskId}/${newManagerId}`,
        method: "PATCH",
         body:{startDate, endDate, reason}
      }),
      invalidatesTags:["Task"]
    }),

        createTaskFromExcel: builder.mutation<
      any,
      {
        createdBy: string;
        managerId: string;
        projectId: string;
        file: any;
      }
    >({
      query: ({ createdBy,managerId,projectId,file }) => ({
        url: `/api/admin/task/create/excel/${createdBy}/${managerId}/${projectId}`,
        method: "POST",
        body:file
      }),
      invalidatesTags:["Task"]
    }),



     updateBulkTaskData: builder.mutation<any,{ taskDatas: any[]}>({
      query: ({ taskDatas }) => ({
        url: `/api/admin/task/update/bulk`,
        method: "PATCH",
        body:{taskDatas}
      }),
      invalidatesTags:["Task"]
    }),
  }),
});    

export const {
  useCreateTaskMutation,
  useGetAllTaskQuery,
  useGetTaskByIdQuery,
  useUpdateTaskMutation,
  useUpdateTaskStatusMutation,
  useDeleteTaskMutation,
  useReassignedTaskMutation,
  useCreateTaskFromExcelMutation,
  useUpdateBulkTaskDataMutation
} = admin_Task_Api;
