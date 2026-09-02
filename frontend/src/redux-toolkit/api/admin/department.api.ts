import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "@/redux-toolkit/api/session/auth.check";

export const admin_Department_Api = createApi({
  reducerPath: "admin_Department_Api",

  baseQuery: baseQueryWithReauth,
  tagTypes:["Department"],

  endpoints: (builder) => ({
    createDepartment: builder.mutation<any, {body:any}>({
      query: ({body}) => ({
        url: "/api/admin/department/create",
        method: "POST",
        body,
      }),
      invalidatesTags:["Department"]
    }),

    getDepartment: builder.query<any, {companyId:string}>({
      query: ({companyId}) => ({
        url: `/api/admin/department/get/${companyId}`,
        method: "GET",
      }),
      providesTags:["Department"]
    }),

    updateDepartment: builder.mutation<any,{id: string; body: any, companyId:string} >({
      query: ({ id, body, companyId }) => ({
        url: `/api/admin/department/update/${id}/${companyId}`,
        method: "PUT",
        body,
      }),
       invalidatesTags:["Department"]
    }),

    deleteDepartment: builder.mutation<any,{id: string; companyId: string}>({
      query: ({ id, companyId }) => ({
        url: `/api/admin/department/delete/${id}/${companyId}`,
        method: "DELETE",
      }),
       invalidatesTags:["Department"]
    }),
  }),
});

export const {
  useCreateDepartmentMutation,
  useGetDepartmentQuery,
  useUpdateDepartmentMutation,
  useDeleteDepartmentMutation,
} = admin_Department_Api;
