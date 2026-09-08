import React, { useEffect } from "react";
import { FolderKanban, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Helmet } from "react-helmet-async";
import { socket } from "@/socket/socket";
import { formatDateTime, getPriorityColor, getStatusColor } from "@/services/allFunctions";
import { useGetMyProjectsQuery } from "@/redux-toolkit/api/client/auth.api";

const ClientProjects: React.FC = () => {
  const { data, refetch, isLoading } = useGetMyProjectsQuery();
  const projects = data?.data || [];

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
        <title>My Projects</title>
      </Helmet>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">My Projects</CardTitle>
          <CardDescription>Projects your admin has linked to your account. Read-only.</CardDescription>
        </CardHeader>

        <CardContent>
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

                {!isLoading && projects.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                      <FolderKanban className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      No project has been linked to your account yet.
                    </TableCell>
                  </TableRow>
                )}

                {projects.map((project: any) => (
                  <TableRow key={project._id}>
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
                      <Badge className={getStatusColor(project.status)} variant="secondary">
                        {project.status}
                      </Badge>
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
