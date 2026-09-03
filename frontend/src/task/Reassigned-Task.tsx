import React, { useEffect, useState } from "react";
import {
  Search,
  Filter,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { formatDateTime } from "@/services/allFunctions";
import { useReassignedHistoryQuery } from "@/redux-toolkit/api/admin/project.api";
import {socket} from "@/socket/socket";

const ReassignedTask: React.FC = () => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const { toast } = useToast();
  const [search, setSearch] = useState<string>("");
  const [filterType, setFilterType] = useState<string>("all");
  const { data, isLoading, isError, error, refetch:reassignedHistoryRefetch } = useReassignedHistoryQuery(undefined,{skip:!user?.id || !user?.role});

  const reassignedItems = data?.data || [];

  const filteredItems = reassignedItems.filter((item: any) => {
    const itemName =
      item?.task?.name || item?.subTask?.name || item?.project?.name || "";

    const searchText = search.toLowerCase();

    const matchesSearch =
      itemName.toLowerCase().includes(searchText) ||
      item?.fromUser?.email?.toLowerCase().includes(searchText) ||
      item?.toUser?.email?.toLowerCase().includes(searchText);

    const matchesType = filterType === "all" || item?.type === filterType;

    return matchesSearch && matchesType;
  });


    useEffect(() => {
      const handleNotification = async(data) => {
          if(data?.recipientId?.toString() === user?.id?.toString()){
             reassignedHistoryRefetch();
          }
      };
      socket.on("notification", handleNotification);
  
      return () => {
        socket.off("notification", handleNotification);
      };
    },[reassignedHistoryRefetch, user?.id]);


  const getItemName = (item: any) => {
    if (item?.type === "project") {
      return item?.project?.name || "Unnamed Project";
    }

    if (item?.type === "task") {
      return item?.task?.name || "Unnamed Task";
    }

    if (item?.type === "subtask") {
      return item?.subTask?.name || "Unnamed Sub Task";
    }

    return "Unknown";
  };

  const getAssigneeName = (user: any) => {
    if (!user) return "-";

    return user?.name || user?.fullName || user?.email || "-";
  };

  const getUserRole = (user: any) => {
    return user?.role || "";
  };

  return (
    <>
      <div className="flex flex-col min-h-screen bg-gray-50/50 p-6 space-y-6 md:mt-[-26px]">
        <Card className="border-red-100 shadow-sm">
          <CardHeader>
            <CardTitle className="text-[16px] sm:text-xl font-semibold">
              Reassigned History ({filteredItems.length})
            </CardTitle>

            <CardDescription className="text-[11px] sm:text-sm mt-1">
              View the complete history of reassigned tasks and sub tasks.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Search and Filter */}

            <div className="flex flex-col md:flex-row gap-4 mb-6">
              {/* Search Input (NO CHANGE as requested) */}
              <div
                className={`relative ${
                  user?.role === "admin" ? "flex-1" : "w-full"
                }`}
              >
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search task, sub task, project..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className={`pl-8 ${user?.role !== "admin" ? "w-full" : ""}`}
                />
              </div>

              {/* Filters Row (ONLY MOBILE FIX HERE) */}
              <div className="flex flex-row gap-2 w-full md:w-auto">
                {/* Status Filter */}
                <div className="flex-1 md:w-48">
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="text-[12px] md:text-sm">
                      <Filter className="w-4 h-4 mr-1 text-muted-foreground" />
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="task">Task</SelectItem>
                      <SelectItem value="subtask">Sub Task</SelectItem>
                      <SelectItem value="project">Project</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="text-[11px] md:text-sm">
                    <TableHead className="px-1 md:px-4">Type</TableHead>

                    <TableHead className="px-1 md:px-4">Item</TableHead>

                    {user?.role !== "employee" && (
                      <TableHead className="hidden md:table-cell">
                        Project
                      </TableHead>
                    )}

                    <TableHead className="hidden md:table-cell">
                      Previous Assignee
                    </TableHead>

                    <TableHead className="hidden md:table-cell">
                      New Assignee
                    </TableHead>

                    <TableHead className="hidden md:table-cell">
                      Reassigned By
                    </TableHead>

                    <TableHead className="hidden lg:table-cell">
                      Reason
                    </TableHead>

                    <TableHead className="px-1 md:px-4">
                      Reassigned At
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-24 text-center">
                        Loading reassigned history...
                      </TableCell>
                    </TableRow>
                  ) : isError ? (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="h-24 text-center text-red-500"
                      >
                        No reassigned history found.
                      </TableCell>
                    </TableRow>
                  ) : filteredItems.length > 0 ? (
                    filteredItems.map((item: any) => (
                      <TableRow
                        key={item?.id}
                        className="text-[11px] md:text-sm"
                      >
                        {/* TYPE */}
                        <TableCell className="px-1 md:px-4">
                          <Badge variant="outline" className="capitalize">
                            {item?.type === "subtask"
                              ? "Sub Task"
                              : item?.type || "-"}
                          </Badge>
                        </TableCell>

                        {/* ITEM */}
                        <TableCell className="font-medium px-1 md:px-4">
                          <span className="truncate block max-w-[160px]">
                            {getItemName(item)}
                          </span>
                        </TableCell>

                        {/* PROJECT */}
                        {user?.role !== "employee" && (
                          <TableCell className="hidden md:table-cell">
                            {item?.project?.name || "-"}
                          </TableCell>
                        )}

                        {/* PREVIOUS ASSIGNEE */}
                        <TableCell className="hidden md:table-cell">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1">
                              <span className="font-medium truncate max-w-[120px]">
                                {getAssigneeName(item?.fromUser)}
                              </span>

                              {getUserRole(item?.fromUser) && (
                                <Badge
                                  variant="secondary"
                                  className="text-[9px] px-1.5 py-0 h-5 capitalize shrink-0"
                                >
                                  {getUserRole(item?.fromUser)}
                                </Badge>
                              )}
                            </div>

                            {item?.fromUser?.email && (
                              <p className="text-[10px] text-muted-foreground truncate max-w-[180px]">
                                {item.fromUser.email}
                              </p>
                            )}
                          </div>
                        </TableCell>

                        {/* NEW ASSIGNEE */}
                        <TableCell className="hidden md:table-cell">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1">
                              <span className="font-medium truncate max-w-[120px]">
                                {getAssigneeName(item?.toUser)}
                              </span>

                              {getUserRole(item?.toUser) && (
                                <Badge
                                  variant="secondary"
                                  className="text-[9px] px-1.5 py-0 h-5 capitalize shrink-0"
                                >
                                  {getUserRole(item?.toUser)}
                                </Badge>
                              )}
                            </div>

                            {item?.toUser?.email && (
                              <p className="text-[10px] text-muted-foreground truncate max-w-[180px]">
                                {item.toUser.email}
                              </p>
                            )}
                          </div>
                        </TableCell>

                        {/* REASSIGNED BY */}
                        <TableCell className="hidden md:table-cell">
                          <div className="min-w-0">
                            <span className="font-medium truncate block max-w-[150px]">
                              {getAssigneeName(item?.reassignedBy)}<span>{" "}</span> 
                               {getUserRole(item?.reassignedBy) && (
                                <Badge
                                  variant="secondary"
                                  className="text-[9px] px-1.5 py-0 h-5 capitalize shrink-0"
                                >
                                  {getUserRole(item?.reassignedBy)}
                                </Badge>
                              )}
                            </span>

                            {item?.reassignedBy?.email && (
                              <p className="text-[10px] text-muted-foreground truncate max-w-[180px]">
                                {item.reassignedBy.email}
                              </p>
                            )}
                          </div>
                        </TableCell>

                        {/* REASON */}
{/* REASON */}
<TableCell className="hidden lg:table-cell">
  {item?.reason ? (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="block max-w-[140px] truncate cursor-pointer">
          {item.reason}
        </span>
      </TooltipTrigger>

      <TooltipContent
        side="top"
        align="start"
        className="max-w-[350px] whitespace-normal break-words text-sm"
      >
        {item.reason}
      </TooltipContent>
    </Tooltip>
  ) : (
    <span className="text-muted-foreground">-</span>
  )}
</TableCell>


                        {/* REASSIGNED AT */}
                        <TableCell className="px-1 md:px-4 whitespace-nowrap">
                          {formatDateTime(item?.reassignedAt)}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="h-20 text-center text-sm"
                      >
                        No reassigned history found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default ReassignedTask;
