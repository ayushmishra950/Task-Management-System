import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "@/redux-toolkit/api/session/auth.check";

export const admin_Client_Api = createApi({
  reducerPath: "admin_Client_Api",

  baseQuery: baseQueryWithReauth,
  tagTypes: ["Client"],

  endpoints: (builder) => ({
    registerClient: builder.mutation<any, { body: any }>({
      query: ({ body }) => ({
        url: "/api/admin/client/register",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Client"],
    }),

    getAllClients: builder.query<any, { companyId: string }>({
      query: ({ companyId }) => ({
        url: `/api/admin/client/get/${companyId}`,
        method: "GET",
      }),
      providesTags: ["Client"],
    }),

    getClientById: builder.query<any, { id: string; companyId: string }>({
      query: ({ id, companyId }) => ({
        url: `/api/admin/client/getById/${id}/${companyId}`,
        method: "GET",
      }),
      providesTags: ["Client"],
    }),

    updateClient: builder.mutation<any, { id: string; companyId: string; body: any }>({
      query: ({ id, companyId, body }) => ({
        url: `/api/admin/client/update/${id}/${companyId}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Client"],
    }),

    deleteClient: builder.mutation<any, { id: string; companyId: string }>({
      query: ({ id, companyId }) => ({
        url: `/api/admin/client/delete/${id}/${companyId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Client"],
    }),
  }),
});

export const {
  useRegisterClientMutation,
  useGetAllClientsQuery,
  useGetClientByIdQuery,
  useUpdateClientMutation,
  useDeleteClientMutation,
} = admin_Client_Api;
