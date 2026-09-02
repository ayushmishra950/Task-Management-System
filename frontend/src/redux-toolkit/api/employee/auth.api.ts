import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "@/redux-toolkit/api/session/auth.check";

export const employee_Auth_Api = createApi({
  reducerPath: "employee_Auth_Api",

  baseQuery: baseQueryWithReauth,

  endpoints: (builder) => ({
    // Employee Login
    loginEmployee: builder.mutation<
      any,
      {
        email: string;
        password: string;
      }
    >({
      query: ({ email, password }) => ({
        url: "/api/employee/auth/login",
        method: "POST",
        body: {
          email,
          password,
        },
      }),
    }),

    // Employee Logout
    logoutEmployee: builder.mutation<any, void>({
      query: () => ({
        url: "/api/employee/auth/logout",
        method: "PUT",
      }),
    }),

     getEmployeeById: builder.query<
      any,
      {
        id: string;
        companyId: string;
      }
    >({
      query: ({ id, companyId }) => ({
        url: `/api/employee/auth/getById/${id}/${companyId}`,
        method: "GET",
      }),
      
    }),

     allRolePasswordUpate: builder.mutation<any, void>({
      query: () => ({
        url: "/api/session/token/update/password",
        method: "PATCH",
      }),
    }),
  }),
});

export const {
  useLoginEmployeeMutation,
  useLogoutEmployeeMutation,
  useAllRolePasswordUpateMutation,
  useGetEmployeeByIdQuery
} = employee_Auth_Api;
