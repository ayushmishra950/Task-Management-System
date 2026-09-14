import React, { useEffect, useState } from "react";
import { FolderKanban, Loader2, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Helmet } from "react-helmet-async";
import { socket } from "@/socket/socket";
import { formatDateTime, getPriorityColor, getStatusColor } from "@/services/allFunctions";
import { useGetMyProjectsQuery } from "@/redux-toolkit/api/client/auth.api";
import { useLocation } from "react-router-dom";
import ActiveFilterBanner, { isOverdueItem } from "@/components/cards/ActiveFilterBanner";

const ClientProjects: React.FC = () => {
  const location = useLocation();
  const { data, refetch, isLoading } = useGetMyProjectsQuery();
  const projects = data?.data || [];

  // Dashboard card se aaye to status filter pehle se set rahe
  const [filterStatus, setFilterStatus] = useState<string>(location?.state?.status ?? "all");

  const filteredProjects = projects.filter((project: any) => {
    if (filterStatus === "all") return true;
    if (filterStatus === "overdue") return isOverdueItem(project);
    return project?.status === filterStatus;
  });

  // Dashboard par project click karke aaye to wo row highlight karke scroll kar do
  const viewProjectId = location?.state?.viewProjectId;
  useEffect(() => {
    if (!viewProjectId || !projects.length) return;
    document.getElementById(`client-project-${viewProjectId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [viewProjectId, projects.length]);

  useEffect(() => {
    const handleChange = () => refetch();

    socket.on("clientProject:changed", handleChange);
    socket.on("clientRequest:changed", handleChange);
    socket.on("notification", handleChange);

    return () => {
      socket.off("clientProject:changed", handleChange);
      socket.off("clientRequest:changed", handleChange);
      socket.off("notification", handleChange);
    };
  }, [refetch]);

  return (
    <>
      <Helmet>
      </Helmet>

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base">My Projects</CardTitle>
            <CardDescription>Projects your admin has linked to your account. Read-only.</CardDescription>
          </div>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="sm:w-48">
              <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Kaunsa filter laga hai / kis dashboard card se aaye */}
          <ActiveFilterBanner
            sourceTitle={location?.state?.cardTitle}
            isSourceFilter={filterStatus === (location?.state?.status ?? "all")}
            status={filterStatus}
            count={filteredProjects.length}
            itemLabel="projects"
            onClear={() => setFilterStatus("all")}
          />

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10">
                      <Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                )}

                {!isLoading && filteredProjects.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                      <FolderKanban className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      {projects.length === 0
                        ? "No project has been linked to your account yet."
                        : "No project matches this filter."}
                    </TableCell>
                  </TableRow>
                )}

                {filteredProjects.map((project: any) => (
                  <TableRow
                    key={project._id}
                    id={`client-project-${project._id}`}
                    className={project._id === viewProjectId ? "bg-primary/10 ring-1 ring-inset ring-primary/40" : undefined}
                  >
                    <TableCell className="font-medium">
                      {project.name}
                      {project.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{project.description}</p>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={getPriorityColor(project.priority)} variant="secondary">
                        {project.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-1">
                        <Badge className={getStatusColor(project.status)} variant="secondary">
                          {project.status}
                        </Badge>
                        {isOverdueItem(project) && (
                          <Badge variant="secondary" className="bg-red-100 text-red-700">
                            Overdue
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap">
                      {project.startDate ? formatDateTime(project.startDate) : "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap">
                      {project.endDate ? formatDateTime(project.endDate) : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default ClientProjects;
