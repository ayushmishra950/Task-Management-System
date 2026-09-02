import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "@/redux-toolkit/api/session/auth.check";

export const admin_Notification_Api = createApi({
  reducerPath: "admin_Notification_Api",

  baseQuery: baseQueryWithReauth,

  endpoints: (builder) => ({

    // GET ALL NOTIFICATIONS
    getAllNotification: builder.query<any, void>({
      query: () => ({
        url: `/api/admin/notification/get`,
        method: "GET",
      }),
    }),

     deletedNotification: builder.mutation<any, {notificationId: string}>({
      query: ({notificationId}) => ({
        url: `/api/admin/notification/delete/${notificationId}`,
        method: "DELETE",
      }),
    }),

     deletedAllNotification: builder.mutation<any, void>({
      query: () => ({
        url: `/api/admin/notification/delete-all`,
        method: "DELETE",
      }),
    }),

      markAllNotifications: builder.mutation<any, void>({
      query: () => ({
        url: `/api/admin/notification/markAllNotification`,
        method: "PATCH",
      }),
    }),
  }),
});

export const {
  useGetAllNotificationQuery,
  useDeletedNotificationMutation,
  useDeletedAllNotificationMutation,
  useMarkAllNotificationsMutation      
} = admin_Notification_Api;
