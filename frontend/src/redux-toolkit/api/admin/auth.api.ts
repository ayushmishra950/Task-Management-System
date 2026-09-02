import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "@/redux-toolkit/api/session/auth.check";

export const admin_Auth_Api = createApi({
  reducerPath: "admin_Auth_Api",

  baseQuery: baseQueryWithReauth,

  endpoints: (builder) => ({
    loginAdmin: builder.mutation<
      any,
      {
        email: string;
        password: string;
      }
    >({
      query: ({ email, password }) => ({
        url: "/api/admin/auth/login",
        method: "POST",
        body: {
          email,
          password,
        },
      }),
    }),

    // DELETE ADMIN
    deleteAdmin: builder.mutation<
      any,
      {
        id: string;
        companyId: string;
      }
    >({
      query: ({ id, companyId }) => ({
        url: `/api/admin/auth/delete/${id}/${companyId}`,
        method: "DELETE",
      }),
    }),

    // UPDATE ADMIN
    updateAdmin: builder.mutation<
      any,
      {
        id: string;
        companyId: string;
        body: any;
      }
    >({
      query: ({ id, body, companyId }) => ({
        url: `/api/admin/auth/update/${id}/${companyId}`,
        method: "PUT",
        body,
      }),
    }),

    // ADMIN LOGOUT
    logoutAdmin: builder.mutation<any, void>({
      query: () => ({
        url: "/api/admin/auth/logout",
        method: "PUT",
      }),
    }),

    // GET ADMIN BY ID
    getByIdAdmin: builder.query<
      any,
      {
        id: string;
        companyId: string;
      }
    >({
      query: ({ id, companyId }) => ({
        url: `/api/admin/auth/getById/${id}/${companyId}`,
        method: "GET",
      }),
    }),

    adminpasswordUpate: builder.mutation<any, {id:string, role:string,companyId:string, password:string}>({
      query: ({id, role, password, companyId}) => ({
        url: `/api/session/token/update/user/password/${id}/${companyId}`,
        method: "PATCH",
        body:{role, password}
      }),
    }),
  }),
});

export const {
  useLoginAdminMutation,
  useDeleteAdminMutation,
  useUpdateAdminMutation,
  useLogoutAdminMutation,
  useGetByIdAdminQuery,
  useAdminpasswordUpateMutation,
} = admin_Auth_Api;
