import React, { useEffect, useState } from "react";
import { Search } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
import { useToast } from "@/hooks/use-toast";
import { formatDateTime } from "@/services/allFunctions";
import { useCompletedAssignmentQuery } from "@/redux-toolkit/api/admin/project.api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {socket} from "@/socket/socket";

const CompletedTask: React.FC = () => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const [search, setSearch] = useState<string>("");
  const [filterType, setFilterType] = useState("all");

  const { data, isLoading, refetch:completeAssignmentRefetch } = useCompletedAssignmentQuery(undefined,{skip:!user?.id || !user?.role});
  console.log("Completed Assignment Data:-", data);
  const completedItems = data?.data || [];

  const filteredItems = completedItems.filter((item: any) => {
    const searchText = search.toLowerCase().trim();

    const projectName = item?.project?.name?.toLowerCase() || "";
    const taskName = item?.task?.name?.toLowerCase() || "";
    const subTaskName = item?.subTask?.name?.toLowerCase() || "";

    let matchesSearch = true;

    if (searchText) {
      if (filterType === "project") {
        matchesSearch = projectName.includes(searchText);
      } else if (filterType === "task") {
        matchesSearch = taskName.includes(searchText);
      } else if (filterType === "subTask") {
        matchesSearch = subTaskName.includes(searchText);
      } else {
        // All → Project + Task + Sub Task
        matchesSearch =
          projectName.includes(searchText) ||
          taskName.includes(searchText) ||
          subTaskName.includes(searchText);
      }
    }

    return matchesSearch;
  });

  useEffect(() => {
    const handleNotification = async(data) => {
        if(data?.recipientId?.toString() === user?.id?.toString()){
           completeAssignmentRefetch();
        }
    };
    socket.on("notification", handleNotification);

    return () => {
      socket.off("notification", handleNotification);
    };
  },[completeAssignmentRefetch, user?.id]);

  const getItemName = (item: any) => {
    if (item?.type === "project") {
      return item?.project?.name || "Unnamed Project";
    }

    if (item?.type === "task") {
      return item?.task?.name || "Unnamed Task";
    }

    if (item?.type === "subTask") {
      return item?.subTask?.name || "Unnamed Sub Task";
    }

    return "Unknown";
  };

  const getParentTaskName = (item: any) => {
    return item?.subTask?.task?.name || "-";
  };

  const getCompletedBy = (item: any) => {
    const user = item?.completedBy || item?.createdBy || item?.manager;

    if (!user) return null;

    return {
      name: user?.name || "-",
      email: user?.email || "",
      role: user?.role || "",
    };
  };

  return (
    <>
      <div className="flex flex-col min-h-screen bg-gray-50/50 p-6 space-y-6 md:mt-[-26px]">
        <Card className="border-red-100 shadow-sm">
          <CardHeader>
            <CardTitle className="text-[16px] sm:text-xl font-semibold">
              Completed Items ({filteredItems.length})
            </CardTitle>

            <CardDescription className="text-[11px] sm:text-sm mt-1">
              View projects, tasks, and sub tasks that have been completed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Search and Filter */}

<div className="flex w-full mb-6">
  <div className="relative flex w-full items-center gap-2">
    {/* Search Input */}
    <div className="relative flex-1">
      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />

      <Input
        placeholder={user?.role === "employee" ? "Search your sub tasks..." : "Search project, task or sub task..."}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full pl-8"
      />
    </div>

    {/* Filter Select */}
    <Select value={filterType} onValueChange={setFilterType}>
      <SelectTrigger className="w-32 md:w-40 text-sm">
        <SelectValue placeholder="Filter" />
      </SelectTrigger>

      <SelectContent>
        <SelectItem value="all">All</SelectItem>

        {user?.role === "admin" && (
          <SelectItem value="project">Project</SelectItem>
        )}

        {user?.role !== "employee" && (
          <SelectItem value="task">Task</SelectItem>
        )}

        <SelectItem value="subTask">Sub Task</SelectItem>
      </SelectContent>
    </Select>
  </div>
</div>


            {/* Table */}
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="text-[11px] md:text-sm">
                    <TableHead className="px-1 md:px-4">Type</TableHead>

                    <TableHead className="px-1 md:px-4">
                      Completed Item
                    </TableHead>

                    {user?.role !== "employee" && (
                      <TableHead className="hidden md:table-cell">
                        Project
                      </TableHead>
                    )}

                    <TableHead className="hidden md:table-cell">
                      Parent Task
                    </TableHead>

                    <TableHead className="hidden md:table-cell">
                      Assigned By
                    </TableHead>

                    <TableHead className="px-1 md:px-4">Completed At</TableHead>

                    <TableHead className="px-1 md:px-4">Status</TableHead>

                    {/* <TableHead className="text-right px-1 md:px-4">
                      Actions
                    </TableHead> */}
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-24 text-center">
                        Loading completed items...
                      </TableCell>
                    </TableRow>
                  ) : filteredItems.length > 0 ? (
                    filteredItems.map((item) => (
                      <TableRow
                        key={item?.id}
                        className="text-[11px] md:text-sm"
                      >
                        {/* TYPE */}
                        <TableCell className="px-1 md:px-4">
                          <Badge variant="outline">
                            {item?.type === "project"
                              ? "Project"
                              : item?.type === "task"
                                ? "Task"
                                : "Sub Task"}
                          </Badge>
                        </TableCell>

                        {/* COMPLETED ITEM */}
                        <TableCell className="font-medium px-1 md:px-4">
                          {getItemName(item)}
                        </TableCell>

                        {/* PROJECT */}
                        {user?.role !== "employee" && (
                          <TableCell className="hidden md:table-cell">
                            {item?.project?.name || "-"}
                          </TableCell>
                        )}

                        {/* PARENT TASK */}
                        <TableCell className="hidden md:table-cell">
                          {getParentTaskName(item)}
                        </TableCell>

                        {/* COMPLETED BY */}
                        <TableCell className="hidden md:table-cell">
                          {(() => {
                            const completedBy = getCompletedBy(item);

                            if (!completedBy) {
                              return (
                                <span className="text-muted-foreground">-</span>
                              );
                            }

                            return (
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium truncate max-w-[140px]">
                                      {completedBy.name}
                                    </span>

                                    {completedBy.role && (
                                      <Badge
                                        variant="secondary"
                                        className="text-[9px] px-1.5 py-0 h-5 capitalize shrink-0"
                                      >
                                        {completedBy.role}
                                      </Badge>
                                    )}
                                  </div>

                                  {completedBy.email && (
                                    <p className="text-[10px] text-muted-foreground truncate max-w-[180px]">
                                      {completedBy.email}
                                    </p>
                                  )}
                                </div>
                              </div>
                            );
                          })()}
                        </TableCell>

                        {/* COMPLETED AT */}
                        <TableCell className="px-1 md:px-4 whitespace-nowrap">
                          {formatDateTime(item?.completedAt)}
                        </TableCell>

                        {/* STATUS */}
                        <TableCell className="px-1 md:px-4">
                          <Badge className="bg-green-100 text-green-700">
                            Completed
                          </Badge>
                        </TableCell>

                        {/* ACTIONS */}
                        <TableCell className="text-right px-1 md:px-4">
                          {/* View / actions */}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="h-20 text-center text-sm"
                      >
                        No completed items found.
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

export default CompletedTask;
