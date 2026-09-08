import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "@/redux-toolkit/api/session/auth.check";

export const admin_ClientRequest_Api = createApi({
  reducerPath: "admin_ClientRequest_Api",

  baseQuery: baseQueryWithReauth,
  tagTypes: ["ClientRequest"],

  endpoints: (builder) => ({
    getAllClientRequests: builder.query<any, { status?: string } | void>({
      query: (args) => ({
        url: `/api/admin/clientRequest/get${args && args.status && args.status !== "all" ? `?status=${args.status}` : ""}`,
        method: "GET",
      }),
      providesTags: ["ClientRequest"],
    }),

    getClientRequestById: builder.query<any, { id: string }>({
      query: ({ id }) => ({
        url: `/api/admin/clientRequest/getById/${id}`,
        method: "GET",
      }),
      providesTags: ["ClientRequest"],
    }),

    reviewClientRequest: builder.mutation<any, { id: string; body: { status: string; adminRemarks?: string } }>({
      query: ({ id, body }) => ({
        url: `/api/admin/clientRequest/review/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["ClientRequest"],
    }),

    convertRequestToProject: builder.mutation<any, { id: string; body: any }>({
      query: ({ id, body }) => ({
        url: `/api/admin/clientRequest/convert/${id}`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["ClientRequest"],
    }),

    deleteClientRequest: builder.mutation<any, { id: string }>({
      query: ({ id }) => ({
        url: `/api/admin/clientRequest/delete/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["ClientRequest"],
    }),
  }),
});

export const {
  useGetAllClientRequestsQuery,
  useGetClientRequestByIdQuery,
  useReviewClientRequestMutation,
  useConvertRequestToProjectMutation,
  useDeleteClientRequestMutation,
} = admin_ClientRequest_Api;
