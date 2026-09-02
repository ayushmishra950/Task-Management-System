import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "@/redux-toolkit/api/session/auth.check";

export const superAdminauthApi = createApi({
  reducerPath: "superAdmin_Auth_Api",

  baseQuery: baseQueryWithReauth,

  endpoints: (builder) => ({
    // LOGIN
    loginSuperAdmin: builder.mutation<
      any,
      { email: string; password: string }
    >({
      query: ({ email, password }) => ({
        url: "/api/superAdmin/auth/login",
        method: "POST",
        body: {
          email,
          password,
        },
      }),
    }),

    // GET
    getSuperAdmin: builder.query<any, {id:string}>({
     
      query: ({id}) => ({
        url: `/api/superAdmin/auth/get/${id}`,
        method: "GET",
      }),
    }),

    // DELETE
    deleteSuperAdmin: builder.mutation<any, {id:string}>({
      query: (id) => ({
        url: `/api/superAdmin/auth/delete/${id}`,
        method: "DELETE",
      }),
    }),

    // UPDATE
    updateSuperAdmin: builder.mutation<
      any,
      {
        id: string;
        body: any;
      }
    >({
      query: ({ id, body }) => ({
        url: `/api/superAdmin/auth/update/${id}`,
        method: "PUT",
        body,
      }),
    }),

    // LOGOUT
    logoutSuperAdmin: builder.mutation<any, void>({
      query: () => ({
        url: "/api/superAdmin/auth/logout",
        method: "PUT",
      }),
    }),

     superAdminpasswordUpate: builder.mutation<any, {id:string, role:string, password:string}>({
      query: ({id, role, password}) => ({
        url: `/api/session/token/update/superadmin/password/${id}`,
        method: "PATCH",
        body:{role, password}
      }),
    }),
  }),
});

export const {
  useLoginSuperAdminMutation,
  useDeleteSuperAdminMutation,
  useGetSuperAdminQuery,
  useLogoutSuperAdminMutation,
  useUpdateSuperAdminMutation,
  useSuperAdminpasswordUpateMutation
} = superAdminauthApi;
