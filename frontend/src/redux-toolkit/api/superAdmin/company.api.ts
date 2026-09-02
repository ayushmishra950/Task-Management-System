import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "@/redux-toolkit/api/session/auth.check";

export const companyApi = createApi({
  reducerPath: "superAdmin_Company_Api",

  baseQuery: baseQueryWithReauth,
  tagTypes:["company"],

  endpoints: (builder) => ({
    registerCompany: builder.mutation<any, FormData>({
      query: (data) => ({
        url: "/api/superAdmin/Company/register",
        method: "POST",
        body: data,
      }),
      invalidatesTags:["company"]
    }),

    getCompany: builder.query<any, void>({
      query: () => ({
        url: "/api/superAdmin/Company/get",
        method: "GET",
      }),
      providesTags:["company"]
    }),

    getCompanyById: builder.query<any, {id:string}>({
      query: ({id}) => ({
        url: `/api/superAdmin/Company/getById/${id}`,
        method: "GET",
      }),
    }),

    deleteCompany: builder.mutation<any, string>({
      query: (id) => ({
        url: `/api/superAdmin/Company/delete/${id}`,
        method: "DELETE",
      }),
      invalidatesTags:["company"]
    }),

    updateCompany: builder.mutation<
      any,
      {
        id: string;
        body: any;
      }
    >({
      query: ({ id, body }) => ({
        url: `/api/superAdmin/Company/update/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags:["company"]
    }),
  }),
});

export const {
  useRegisterCompanyMutation,
  useGetCompanyQuery,
  useGetCompanyByIdQuery,
  useDeleteCompanyMutation,
  useUpdateCompanyMutation,
} = companyApi;
