import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "@/redux-toolkit/api/session/auth.check";

export const admin_Employee_Api = createApi({
  reducerPath: "admin_Employee_Api",

  baseQuery: baseQueryWithReauth,
  tagTypes:["Employee"],

  endpoints: (builder) => ({
    // REGISTER EMPLOYEE
    registerEmployee: builder.mutation<any, {body:any}>({
      query: ({body}) => ({
        url: "/api/admin/employee/register",
        method: "POST",
        body,
      }),
      invalidatesTags:["Employee"]
    }),

    // GET ALL EMPLOYEES
    getAllEmployee: builder.query<any, {companyId:string}>({
      query: ({companyId}) => ({
        url: `/api/admin/employee/get/${companyId}`,
        method: "GET",
      }),
      providesTags:["Employee"]
    }),

    // GET EMPLOYEE BY ID
    getEmployeeById: builder.query<
      any,
      {
        id: string;
        companyId: string;
      }
    >({
      query: ({ id, companyId }) => ({
        url: `/api/admin/employee/getById/${id}/${companyId}`,
        method: "GET",
      }),
      
    }),

    // UPDATE EMPLOYEE
    updateEmployee: builder.mutation<
      any,
      {
        id: string;
        companyId: string;
        body: any;
      }
    >({
      query: ({ id,companyId, body }) => ({
        url: `/api/admin/employee/update/${id}/${companyId}`,
        method: "PUT",
        body,
      }),
      invalidatesTags:["Employee"]
    }),

    // DELETE EMPLOYEE
    deleteEmployee: builder.mutation<
      any,
      {
        id: string;
        companyId: string;
      }
    >({
      query: ({ id, companyId }) => ({
        url: `/api/admin/employee/delete/${id}/${companyId}`,
        method: "DELETE",
      }),
      invalidatesTags:["Employee"]
    }),
  }),
});

export const {
  useRegisterEmployeeMutation,
  useGetAllEmployeeQuery,
  useGetEmployeeByIdQuery,
  useUpdateEmployeeMutation,
  useDeleteEmployeeMutation,
} = admin_Employee_Api;
