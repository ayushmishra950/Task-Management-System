import React, { useEffect, useRef, useState } from "react";
import { Bell, FolderKanban, Trash, Clock, Inbox } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/contexts/NotificationContext";
import { useToast } from "@/hooks/use-toast";
import DeleteCard from "@/components/cards/DeleteCard";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import {
  useGetAllNotificationQuery,
  useDeletedNotificationMutation,
  useDeletedAllNotificationMutation,
} from "@/redux-toolkit/api/admin/notification.api";
import { socket } from "@/socket/socket";

const Notifications: React.FC = () => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const hasMarkedAsRead = useRef(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const { unreadCount, refreshNotifications, markAllAsRead } = useNotifications();

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);

  const [selectedNotificationId, setSelectedNotificationId] = useState<
    string | null
  >(null);

  const {
    data: notificationData,
    isLoading: isNotificationLoading,
    isError: isNotificationError,
    refetch: refetchNotifications,
  } = useGetAllNotificationQuery();


  const [deleteNotifications, { isLoading: isSingleDelting }] =
    useDeletedNotificationMutation();
  const [deleteAllNotifications, { isLoading: isAllDeleting }] =
    useDeletedAllNotificationMutation();

  const isDeleting = isAllDeleting || isSingleDelting;

  const notificationList = notificationData?.data || [];
 console.log("notifications:", notificationList);

  /*
   * Mark all notifications as read when notification page opens.
   */
  useEffect(() => {
  if (hasMarkedAsRead.current) return;

  hasMarkedAsRead.current = true;
  markAllAsRead();
}, [markAllAsRead]);

  useEffect(() => {
    const handleNotification = () => {
      refetchNotifications();
    };

    socket.on("notification", handleNotification);

    return () => {
      socket.off("notification", handleNotification);
    };
  }, [refetchNotifications]);

  const getTypeIcon = (entityType: string) => {
    switch (entityType) {
      case "Project":
        return <FolderKanban className="w-5 h-5 text-blue-500" />;

      case "Task":
        return <FolderKanban className="w-5 h-5 text-primary" />;

      case "SubTask":
        return <FolderKanban className="w-5 h-5 text-purple-500" />;

      case "ClientRequest":
        return <Inbox className="w-5 h-5 text-emerald-600" />;

      default:
        return <Bell className="w-5 h-5 text-blue-500" />;
    }
  };

  const handleNotificationClick = (notification: any) => {
    if (!notification?._id) return;

   
    switch (notification?.entityType) {
      case "Task":
        /*
         * Keep your existing task route.
         * If your router supports:
         * /tasks/task/:id
         * then you can use:
         *
         * navigate(`/tasks/task/${notification.entityId}`);
         */
        navigate("/tasks/task");
        break;

      case "SubTask":
        /*
         * Currently using the existing task page.
         * If you have a dedicated subtask route,
         * use entityId there.
         */
        navigate("/tasks/task");
        break;

      case "Project":
        /*
         * Keep your existing project route.
         * If your router supports:
         * /tasks/projects/:id
         * then you can use:
         *
         * navigate(`/tasks/projects/${notification.entityId}`);
         */
        // Client apne project section me jayega, staff admin wale projects page par
        navigate(user?.role === "client" ? "/client/projects" : "/tasks/projects");
        break;

      case "ClientRequest":
        // Client apni request list dekhta hai, admin apna inbox
        navigate(user?.role === "client" ? "/client/requests" : "/tasks/client-requests");
        break;

      default:
        break;
    }
  };

  /*
   * Delete notification
   */
  const handleConfirmDelete = async () => {
    try {
      let res;

      if (selectedNotificationId) {
        res = await deleteNotifications({
          notificationId: selectedNotificationId,
        }).unwrap();
      } else {
        res = await deleteAllNotifications().unwrap();
      }
      await refetchNotifications();
      refreshNotifications();

      toast({
        title: `${selectedNotificationId ? "Notification Deleted" : "All Notifications Deleted"}`,
        description: res?.message,
      });
      setIsDeleteDialogOpen(false);
      setSelectedNotificationId(null);
    } catch (error: any) {
      console.error("Delete Notification Error:", error);

      toast({
        title: "Delete Notification Error",
        description:
          error?.data?.errors?.[0]?.message ||
          error?.data?.message ||
          "Something went wrong",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Helmet>
        <title>Notification Page</title>
        <meta name="description" content="View and manage your notifications" />
      </Helmet>

      {/* Delete Confirmation */}
      <DeleteCard
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setSelectedNotificationId(null);
        }}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
        title={
          selectedNotificationId
            ? "Delete Notification Message?"
            : "Delete All Notification Messages?"
        }
        message={
          selectedNotificationId
            ? "This action will permanently delete this notification message."
            : "This action will permanently delete all notification messages."
        }
      />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-row items-end sm:justify-end gap-4 md:mt-[-20px]">
          <Button
            variant="outline"
            onClick={() => {
              setSelectedNotificationId(null);
              setIsDeleteDialogOpen(true);
            }}
          >
            <Trash size={18} className="text-red-500 mr-2" />
            Clear All
          </Button>
        </div>

        {/* Notifications List */}
        <Card>
          <CardHeader>
            <CardTitle>All Notifications</CardTitle>
          </CardHeader>

          <CardContent>
            <div className="space-y-1">
              {/* Loading */}
              {isNotificationLoading && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    Loading notifications...
                  </p>
                </div>
              )}

              {/* API Error */}
              {!isNotificationLoading && isNotificationError && (
                <div className="text-center py-12">
                  <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />

                  <p className="text-muted-foreground">
                    Unable to load notifications.
                  </p>
                </div>
              )}

              {/* Empty State */}
              {!isNotificationLoading &&
                !isNotificationError &&
                notificationList.length === 0 && (
                  <div className="text-center py-12">
                    <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />

                    <p className="text-muted-foreground">
                      No notifications yet.
                    </p>
                  </div>
                )}

              {/* Notification List */}
              {!isNotificationLoading &&
                !isNotificationError &&
                notificationList.length > 0 &&
                notificationList.map((notification: any) => (
                  <div
                    key={notification?._id}
                    onClick={() => handleNotificationClick(notification)}
                    className={cn(
                      "flex gap-4 p-4 rounded-lg transition-colors cursor-pointer",
                      !notification?.isRead
                        ? "bg-primary/5 hover:bg-primary/10"
                        : "hover:bg-muted",
                    )}
                  >
                    {/* Icon */}
                    <div className="p-2 rounded-lg bg-card border self-start">
                      {getTypeIcon(notification?.entityType)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          {/* Title */}
                          <h3
                            className={cn(
                              "font-medium",
                              !notification?.isRead && "text-primary",
                            )}
                          >
                            {notification?.title || "Notification"}
                          </h3>

                          {/* Message */}
                          <p className="text-sm text-muted-foreground mt-1">
                            {notification?.message ||
                              "You have a new notification."}
                          </p>

                          {/* Created By */}
                          {notification?.createdBy &&
                            typeof notification.createdBy === "object" && (
                              <p className="text-xs text-muted-foreground mt-2">
                                By{" "}
                                <span className="font-medium">
                                  { notification.createdBy.fullName}
                                </span>
                                <span className="capitalize">
                                  ({notification.createdBy.role})
                                </span>
                              </p>
                            )}
                        </div>

                        {/* Unread Indicator */}
                        {/* Delete Button + Unread Indicator */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {!notification?.isRead && (
                            <span className="w-2 h-2 rounded-full bg-primary" />
                          )}

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();

                              setSelectedNotificationId(notification?._id);
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            <Trash size={18} className="text-red-500" />
                          </Button>
                        </div>
                      </div>

                      {/* Date */}
                      <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                        <Clock className="w-3 h-3" />

                        {notification?.createdAt
                          ? new Date(notification.createdAt).toLocaleString()
                          : "-"}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default Notifications;
