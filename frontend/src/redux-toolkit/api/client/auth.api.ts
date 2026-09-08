import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "@/redux-toolkit/api/session/auth.check";

export const client_Auth_Api = createApi({
  reducerPath: "client_Auth_Api",

  baseQuery: baseQueryWithReauth,
  tagTypes: ["ClientProject"],

  endpoints: (builder) => ({
    loginClient: builder.mutation<any, { email: string; password: string }>({
      query: ({ email, password }) => ({
        url: "/api/client/auth/login",
        method: "POST",
        body: { email, password },
      }),
    }),

    logoutClient: builder.mutation<any, void>({
      query: () => ({
        url: "/api/client/auth/logout",
        method: "PUT",
      }),
    }),

    getClientProfileById: builder.query<any, { id: string; companyId: string }>({
      query: ({ id, companyId }) => ({
        url: `/api/client/auth/getById/${id}/${companyId}`,
        method: "GET",
      }),
    }),

    getMyProjects: builder.query<any, void>({
      query: () => ({
        url: "/api/client/auth/my-projects",
        method: "GET",
      }),
      providesTags: ["ClientProject"],
    }),
  }),
});

export const {
  useLoginClientMutation,
  useLogoutClientMutation,
  useGetClientProfileByIdQuery,
  useGetMyProjectsQuery,
} = client_Auth_Api;
