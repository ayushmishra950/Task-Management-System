
import { createContext, useContext, useEffect, ReactNode, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { useGetAllNotificationQuery, useMarkAllNotificationsMutation } from "@/redux-toolkit/api/admin/notification.api";
import { socket } from "@/socket/socket";

interface NotificationContextType {
  unreadCount: number;
  refreshNotifications: () => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider = ({ children}: NotificationProviderProps) => {
  useLocation();
  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  })();
  const { data: notificationData, refetch} = useGetAllNotificationQuery(undefined, {
    skip: !user?.id || !user?.role,
  });
  const [markAllNotifications] = useMarkAllNotificationsMutation();
  const notifications = notificationData?.data || [];

  
  const unreadCount = notifications.filter((notification: any) => !notification?.isRead).length;

  
  const refreshNotifications = useCallback(async () => { await refetch()}, [refetch]);

  useEffect(() => {
    const handleNotification = (data) => {
      if(data?.recipientId?.toString() === user?.id?.toString()){
      refetch();
      }
    };

    socket.on("notification", handleNotification);

    return () => {
      socket.off("notification", handleNotification);
    };
  }, [refetch, user?.id]);


  // Abhi mark-read ka actual logic baad mein add karenge
  const markAllAsRead = useCallback(async () => {
    try{
        await markAllNotifications().unwrap();
          await refetch();
    }
    catch(error:any){
      console.log("Notification Mark Error:", error);
    }
  }, [refetch, markAllNotifications]);

  return (
    <NotificationContext.Provider
      value={{
        unreadCount,
        refreshNotifications,
        markAllAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error(
      "useNotifications must be used within NotificationProvider"
    );
  }

  return context;
};
