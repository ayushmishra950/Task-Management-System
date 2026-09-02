import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "@/redux-toolkit/api/session/auth.check";

export const admin_Project_Api = createApi({
  reducerPath: "admin_Project_Api",

  baseQuery: baseQueryWithReauth,
  tagTypes:["Project"],

  endpoints: (builder) => ({
    createProject: builder.mutation<any, {body:any}>({
      query: ({body}) => ({
        url: "/api/admin/project/create",
        method: "POST",
        body,
      }),
      invalidatesTags:["Project"]
    }),

    getAllProject: builder.query<any, {companyId:string}>({
      query: ({companyId}) => ({
        url: `/api/admin/project/get/${companyId}`,
        method: "GET",
      }),
      providesTags:["Project"]
    }),

    getProjectById: builder.query<
      any,
      {
        id: string;
        companyId: string;
      }
    >({
      query: ({ id, companyId }) => ({
        url: `/api/admin/project/getById/${id}/${companyId}`,
        method: "GET",
      }),
    }),

    updateProject: builder.mutation<
      any,
      {
        id: string;
        companyId: string;
        body: any;
      }
    >({
      query: ({ id, companyId, body }) => ({
        url: `/api/admin/project/update/${id}/${companyId}`,
        method: "PUT",
        body,
      }),
      invalidatesTags:["Project"]
    }),

    updateProjectStatus: builder.mutation<
      any,
      {
        id: string;
        companyId: string;
        body: any;
      }
    >({
      query: ({ id, companyId, body }) => ({
        url: `/api/admin/project/update/status/${id}/${companyId}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags:["Project"]
    }),

    deleteProject: builder.mutation<
      any,
      {
        projectIds: string[];
        companyId: string;
      }
    >({
      query: ({ projectIds, companyId }) => ({
        url: `/api/admin/project/delete/${companyId}`,
        method: "DELETE",
        body:{projectIds}
      }),
      invalidatesTags:["Project"]
    }),

        completedAssignment: builder.query<any, void>({
      query: () => ({
        url: `/api/admin/project/completed/assignment`,
        method: "GET"
      }),
    }),

        reassignedHistory: builder.query<any, void>({
      query: () => ({
        url: `/api/admin/project/reassigned/history`,
        method: "GET",
      }),
    }),

      dashboardData: builder.query<any, void>({
      query: () => ({
        url: `/api/admin/project/dashboard/data`,
        method: "GET",
      }),
    }),

     dashboardSummary: builder.query<any, void>({
      query: () => ({
        url: `/api/admin/project/dashboard/summary`,
        method: "GET",
      }),
    }),
  }),
});

export const {
  useCreateProjectMutation,
  useGetAllProjectQuery,
  useGetProjectByIdQuery,
  useUpdateProjectMutation,
  useUpdateProjectStatusMutation,
  useDeleteProjectMutation,
  useCompletedAssignmentQuery,
  useReassignedHistoryQuery,
  useDashboardDataQuery,
  useDashboardSummaryQuery
} = admin_Project_Api;
