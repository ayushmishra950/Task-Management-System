import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "@/redux-toolkit/api/session/auth.check";

export const admin_SubTask_Api = createApi({
  reducerPath: "admin_SubTask_Api",

  baseQuery: baseQueryWithReauth,
  tagTypes:["SubTask"],

  endpoints: (builder) => ({
    // CREATE SUB TASK
    createSubTask: builder.mutation<any, {body:any}>({
      query: ({body}) => ({
        url: "/api/admin/subTask/create",
        method: "POST",
        body,
      }),
      invalidatesTags:["SubTask"]
    }),

    // GET ALL SUB TASKS
    getAllSubTask: builder.query<any,{ taskId: string; companyId: string}>({
      query: ({ taskId, companyId }) => ({
        url: `/api/admin/subTask/get/${companyId}`,
        method: "GET",
        params: taskId ? {taskId} : undefined,
      }),
      providesTags:["SubTask"]
    }),

    // GET SUB TASK BY ID
    getSubTaskById: builder.query<
      any,
      {
        id: string;
        companyId: string;
      }
    >({
      query: ({ id, companyId }) => ({
        url: `/api/admin/subTask/getById/${id}/${companyId}`,
        method: "GET",
      }),
    }),

    // UPDATE SUB TASK
    updateSubTask: builder.mutation<
      any,
      {
        id: string;
        companyId: string;
        body: any;
      }
    >({
      query: ({ id, companyId, body }) => ({
        url: `/api/admin/subTask/update/${id}/${companyId}`,
        method: "PUT",
        body,
      }),
      invalidatesTags:["SubTask"]
    }),

    // UPDATE SUB TASK STATUS
    updateSubTaskStatus: builder.mutation<
      any,
      {
        id: string;
        companyId: string;
        body: any;
      }
    >({
      query: ({ id, companyId, body }) => ({
        url: `/api/admin/subTask/update/status/${id}/${companyId}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags:["SubTask"]
    }),

    // DELETE SUB TASK
    deleteSubTask: builder.mutation<
      any,
      {
        subTaskIds: string[];
        companyId: string;
      }
    >({
      query: ({ subTaskIds, companyId }) => ({
        url: `/api/admin/subTask/delete/${companyId}`,
        method: "DELETE",
        body:{subTaskIds}
      }),
      invalidatesTags:["SubTask"]
    }),


    reassignedSubTask: builder.mutation<
      any,
      {
        subTaskId: string;
        newEmployeeId: string;
        startDate: string;
        endDate: string;
        reason: string;
      }
    >({
      query: ({ subTaskId, newEmployeeId, startDate, endDate, reason }) => ({
        url: `/api/admin/subTask/reassigned/${subTaskId}/${newEmployeeId}`,
        method: "PATCH",
        body:{startDate, endDate, reason}
      }),
      invalidatesTags:["SubTask"]
    }),


    createSubTaskFromExcel: builder.mutation<
      any,
      {
        createdBy: string;
        employeeId: string;
        taskId: string;
        file: any;
      }
    >({
      query: ({ createdBy,employeeId,taskId,file }) => ({
        url: `/api/admin/subTask/create/excel/${createdBy}/${employeeId}/${taskId}`,
        method: "POST",
        body:file
      }),
      invalidatesTags:["SubTask"]
    }),


      updateBulkSubTaskData: builder.mutation<any,{ subTaskDatas: any[]}>({
      query: ({ subTaskDatas }) => ({
        url: `/api/admin/subTask/update/bulk`,
        method: "PATCH",
        body:{subTaskDatas}
      }),
      invalidatesTags:["SubTask"]
    }),
  }),
});

export const {
  useCreateSubTaskMutation,
  useGetAllSubTaskQuery,
  useGetSubTaskByIdQuery,
  useUpdateSubTaskMutation,
  useUpdateSubTaskStatusMutation,
  useDeleteSubTaskMutation,
  useReassignedSubTaskMutation,
  useCreateSubTaskFromExcelMutation,
  useUpdateBulkSubTaskDataMutation
} = admin_SubTask_Api;
