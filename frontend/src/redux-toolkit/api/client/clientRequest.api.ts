import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "@/redux-toolkit/api/session/auth.check";

export const client_Request_Api = createApi({
  reducerPath: "client_Request_Api",

  baseQuery: baseQueryWithReauth,
  tagTypes: ["ClientRequest", "ClientSummary"],

  endpoints: (builder) => ({
    createClientRequest: builder.mutation<any, { body: any }>({
      query: ({ body }) => ({
        url: "/api/client/request/create",
        method: "POST",
        body,
      }),
      invalidatesTags: ["ClientRequest", "ClientSummary"],
    }),

    getMyClientRequests: builder.query<any, { status?: string } | void>({
      query: (args) => ({
        url: `/api/client/request/get${args && args.status && args.status !== "all" ? `?status=${args.status}` : ""}`,
        method: "GET",
      }),
      providesTags: ["ClientRequest"],
    }),

    getMyClientRequestById: builder.query<any, { id: string }>({
      query: ({ id }) => ({
        url: `/api/client/request/getById/${id}`,
        method: "GET",
      }),
      providesTags: ["ClientRequest"],
    }),

    updateMyClientRequest: builder.mutation<any, { id: string; body: any }>({
      query: ({ id, body }) => ({
        url: `/api/client/request/update/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["ClientRequest", "ClientSummary"],
    }),

    deleteMyClientRequest: builder.mutation<any, { id: string }>({
      query: ({ id }) => ({
        url: `/api/client/request/delete/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["ClientRequest", "ClientSummary"],
    }),

    clientDashboardSummary: builder.query<any, void>({
      query: () => ({
        url: "/api/client/request/dashboard/summary",
        method: "GET",
      }),
      providesTags: ["ClientSummary"],
    }),
  }),
});

export const {
  useCreateClientRequestMutation,
  useGetMyClientRequestsQuery,
  useGetMyClientRequestByIdQuery,
  useUpdateMyClientRequestMutation,
  useDeleteMyClientRequestMutation,
  useClientDashboardSummaryQuery,
} = client_Request_Api;
