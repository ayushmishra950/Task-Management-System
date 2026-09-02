import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "@/redux-toolkit/api/session/auth.check";

export const admin_Manager_Api = createApi({
  reducerPath: "admin_Manager_Api",

  baseQuery: baseQueryWithReauth,
  tagTypes: ["Manager"],

  endpoints: (builder) => ({
    registerManager: builder.mutation<any, {id:string, companyId:string, departmentId:string}>({
      query: ({id, companyId, departmentId}) => ({
        url: `/api/admin/manager/create/${id}/${companyId}/${departmentId}`,
        method: "POST",
      }),
      invalidatesTags: ["Manager"],
    }),

    getAllManager: builder.query<any, {companyId:string}>({
      query: ({companyId}) => ({
        url: `/api/admin/manager/get/${companyId}`,
        method: "GET",
      }),
      providesTags: ["Manager"],
    }),

    updateManager: builder.mutation<
      any,
      {
        id: string;
        companyId: string;
        oldDepartmentId: string;
        newDepartmentId: string;
      }
    >({
      query: ({ id, companyId, oldDepartmentId, newDepartmentId }) => ({
        url: `/api/admin/manager/update/${id}/${companyId}/${oldDepartmentId}/${newDepartmentId}`,
        method: "PUT",
      }),
      invalidatesTags: ["Manager"],
    }),

    deleteManager: builder.mutation<any,
      {
        id: string;
        companyId: string;
        departmentId: string;
      }
    >({
      query: ({ id, companyId, departmentId }) => ({
        url: `/api/admin/manager/delete/${id}/${companyId}/${departmentId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Manager"],
      async onQueryStarted(
        { id, companyId, departmentId },
        { dispatch, queryFulfilled },
      ) {
        try {
          await queryFulfilled;
          dispatch(
            admin_Manager_Api.util.updateQueryData(
              "getAllManager",
              { companyId },
              (draft: any) => {
                if (!Array.isArray(draft?.data)) return;

                draft.data = draft.data
                  .map((manager: any) => {
                    if (manager._id !== id) return manager;

                    return {
                      ...manager,
                      managedDepartments: manager.managedDepartments.filter(
                        (department: any) =>
                          department?._id !== departmentId &&
                          department !== departmentId,
                      ),
                    };
                  })
                  .filter(
                    (manager: any) => manager.managedDepartments?.length,
                  );
              },
            ),
          );
        } catch {
          // Keep the cached list unchanged when the delete fails.
        }
      },
    }),
  }),
});

export const {
  useRegisterManagerMutation,
  useGetAllManagerQuery,
  useUpdateManagerMutation,
  useDeleteManagerMutation,
} = admin_Manager_Api;
