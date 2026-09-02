import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "@/redux-toolkit/api/session/auth.check";

export const superAdmin_admin_Api = createApi({
  reducerPath: "superAdmin_Admin_Api",

  baseQuery: baseQueryWithReauth,
  tagTypes:["Admin"],

  endpoints: (builder) => ({
    registerAdmin: builder.mutation<any, any>({
      query: (data) => ({
        url: "/api/superAdmin/admin/register",
        method: "POST",
        body: data,
      }),
      invalidatesTags:["Admin"]
    }),

    getAllAdmins: builder.query<any, void>({
      query: () => ({
        url: "/api/superAdmin/admin/get",
        method: "GET",
      }),
      providesTags:["Admin"]
    }),

     deleteAdmin: builder.mutation<any, {id:string, companyId:string}>({
      query: ({id, companyId}) => ({
        url: `/api/superAdmin/admin/delete/${id}/${companyId}`,
        method: "DELETE",
      }),
      invalidatesTags:["Admin"]
    }),

    updateAdmin: builder.mutation<
      any,
      {
        id: string;
        body: any;
      }
    >({
      query: ({ id, body }) => ({
        url: `/api/superAdmin/admin/update/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags:["Admin"]
    }),


     updateAdminStatus: builder.mutation<
      any,
      {
        id: string;
        companyId:string;
        body: any;
      }
    >({
      query: ({ id, body, companyId }) => ({
        url: `/api/superAdmin/admin/update/status/${id}/${companyId}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags:["Admin"]
    }),
  }),
});

export const {
  useRegisterAdminMutation,
  useGetAllAdminsQuery,
  useDeleteAdminMutation,
  useUpdateAdminMutation,
  useUpdateAdminStatusMutation
} = superAdmin_admin_Api;
