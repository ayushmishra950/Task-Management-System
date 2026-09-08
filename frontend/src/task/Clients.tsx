import React, { useMemo, useState } from "react";
import { Plus, Search, Edit, Trash2, Loader2, Handshake, Mail, Phone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Helmet } from "react-helmet-async";
import { useToast } from "@/hooks/use-toast";
import DeleteCard from "@/components/cards/DeleteCard";
import ClientForm from "./forms/ClientForm";
import { formatDateTime, getStatusColorfromEmployee } from "@/services/allFunctions";
import { useGetAllClientsQuery, useDeleteClientMutation } from "@/redux-toolkit/api/admin/client.api";

const Clients: React.FC = () => {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [initialData, setInitialData] = useState<any | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const { data, isLoading } = useGetAllClientsQuery(
    { companyId: user?.companyId },
    { skip: user?.role !== "admin" || !user?.companyId }
  );

  const [deleteClient, { isLoading: isDeleting }] = useDeleteClientMutation();

  const clients = data?.data || [];

  const filteredClients = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return clients;

    return clients.filter(
      (client: any) =>
        client.fullName?.toLowerCase().includes(term) ||
        client.email?.toLowerCase().includes(term) ||
        client.clientCompanyName?.toLowerCase().includes(term) ||
        client.contact?.toLowerCase().includes(term)
    );
  }, [clients, search]);

  const handleDelete = async () => {
    if (!deleteTargetId) return;

    try {
      const res = await deleteClient({ id: deleteTargetId, companyId: user?.companyId }).unwrap();
      toast({ title: "Client Deleted", description: res?.message || "Success" });
    } catch (err: any) {
      toast({
        title: "Delete Failed",
        description: err?.data?.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setDeleteTargetId(null);
    }
  };

  return (
    <>
      <Helmet>
        <title>Clients</title>
      </Helmet>

      <DeleteCard
        isOpen={Boolean(deleteTargetId)}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
        title="Delete this client?"
        message="The client account and all of its requests will be permanently removed. Their projects will stay."
      />

      <ClientForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setInitialData(null);
        }}
        initialData={initialData}
      />

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base">Clients</CardTitle>
            <CardDescription>Create client logins so they can raise project and update requests.</CardDescription>
          </div>
          <Button
            onClick={() => {
              setInitialData(null);
              setIsFormOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" /> Add Client
          </Button>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search by name, email, company or contact"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Added On</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10">
                      <Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                )}

                {!isLoading && filteredClients.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                      <Handshake className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      No client added yet.
                    </TableCell>
                  </TableRow>
                )}

                {filteredClients.map((client: any) => (
                  <TableRow key={client._id}>
                    <TableCell>
                      <p className="font-medium">{client.fullName}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Mail className="w-3 h-3" /> {client.email}
                      </p>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{client.clientCompanyName || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {client.contact}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColorfromEmployee(client.status)} variant="secondary">
                        {client.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap">
                      {formatDateTime(client.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setInitialData(client);
                            setIsFormOpen(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => setDeleteTargetId(client._id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
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

export default Clients;
