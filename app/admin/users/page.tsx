"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Edit2, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface AdminUser {
  id: string;
  name: string;
  usn: string;
  email: string | null;
  batch: string | null;
  dept: string | null;
  interviewId: string | null;
  interviewTitle: string | null;
  hasAuthUser: boolean;
  role: string | null;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isLoadingRef = useRef(false);

  const [name, setName] = useState("");
  const [usn, setUsn] = useState("");
  const [email, setEmail] = useState("");
  const [batch, setBatch] = useState("");
  const [dept, setDept] = useState("");

  const [filterBatch, setFilterBatch] = useState<string>("");
  const [filterDept, setFilterDept] = useState<string>("");
  const [filterRole, setFilterRole] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");

  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deletingUsn, setDeletingUsn] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    if (isLoadingRef.current) return; // Prevent multiple simultaneous calls

    isLoadingRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/users");
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to load users");
      }
      const data = await res.json();
      setUsers(data.data || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to load users");
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  console.log("user=", users);

  const handleCreate = async (e: React.FormEvent) => {
    // ... existing handleCreate logic is fine, but I'll update it to use loadUsers for consistency if needed
    // Actually the existing logic manually adds to state, which is fine for performance.
    e.preventDefault();
    setError(null);

    if (!name.trim() || !usn.trim() || !email.trim()) {
      setError("Name, USN and Email are required");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          usn: usn.trim(),
          email: email.trim(),
          batch: batch.trim() || undefined,
          dept: dept.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create user");
      }

      const data = await res.json();
      const created: AdminUser = {
        ...(data.data.user as AdminUser),
        interviewTitle: data.data.user.interviewTitle || null,
      };

      setUsers((prev) => [created, ...prev]);

      toast.success(
        `User created. Temporary password: ${data.data.auth.tempPassword}`,
      );

      setName("");
      setUsn("");
      setEmail("");
      setBatch("");
      setDept("");
    } catch (err: any) {
      console.error("Error creating user:", err);
      setError(err.message || "Failed to create user");
      toast.error(err.message || "Failed to create user");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (usn: string) => {
    setDeletingUsn(usn);
    try {
      const res = await fetch(`/api/admin/users/${usn}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete user");
      }

      toast.success("User deleted successfully");
      setUsers((prev) => prev.filter((u) => u.usn !== usn));
    } catch (err: any) {
      console.error("Error deleting user:", err);
      toast.error(err.message || "Failed to delete user");
    } finally {
      setDeletingUsn(null);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/users/${editingUser.usn}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: editingUser.name,
          email: editingUser.email,
          batch: editingUser.batch,
          dept: editingUser.dept,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update user");
      }

      toast.success("User updated successfully");
      setUsers((prev) =>
        prev.map((u) => (u.usn === editingUser.usn ? editingUser : u)),
      );
      setIsEditDialogOpen(false);
    } catch (err: any) {
      console.error("Error updating user:", err);
      toast.error(err.message || "Failed to update user");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">User Management</h1>
        <p className="text-muted-foreground">
          Add and manage candidate user accounts with batch and department
          filters.
        </p>
      </div>

      {error && (
        <Alert className="border-red-500 bg-red-50 dark:bg-red-950">
          <AlertDescription className="text-red-800 dark:text-red-200">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Create User Form */}
      <Card>
        <CardHeader>
          <CardTitle>Create User</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                disabled={creating}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="usn">USN</Label>
              <Input
                id="usn"
                value={usn}
                onChange={(e) => setUsn(e.target.value)}
                placeholder="1NH20CS001"
                disabled={creating}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="candidate@example.com"
                disabled={creating}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="batch">Batch</Label>
              <Input
                id="batch"
                value={batch}
                onChange={(e) => setBatch(e.target.value)}
                placeholder="2024"
                disabled={creating}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dept">Department</Label>
              <Input
                id="dept"
                value={dept}
                onChange={(e) => setDept(e.target.value)}
                placeholder="CSE"
                disabled={creating}
              />
            </div>
            <div className="md:col-span-3 flex justify-end">
              <Button type="submit" disabled={creating}>
                {creating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create User"
                )}
              </Button>
            </div>
          </form>
          <p className="mt-2 text-xs text-muted-foreground">
            A Supabase Auth account will be created automatically. Temporary
            password is based on USN (e.g. <code>USN@123</code>).
          </p>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <CardTitle>Users</CardTitle>
            <div className="flex flex-wrap gap-3 text-sm">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search name or USN..."
                  className="w-64 pl-9 text-xs"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <span className="block text-xs font-medium text-muted-foreground">
                  Filter by Batch
                </span>
                <select
                  className="w-40 rounded-md border border-input bg-background px-3 py-1.5 text-xs"
                  value={filterBatch}
                  onChange={(e) => setFilterBatch(e.target.value)}
                >
                  <option value="">All</option>
                  {Array.from(
                    new Set(users.map((u) => u.batch).filter(Boolean)),
                  ).map((b) => (
                    <option key={b as string} value={b as string}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <span className="block text-xs font-medium text-muted-foreground">
                  Filter by Department
                </span>
                <select
                  className="w-40 rounded-md border border-input bg-background px-3 py-1.5 text-xs"
                  value={filterDept}
                  onChange={(e) => setFilterDept(e.target.value)}
                >
                  <option value="">All</option>
                  {Array.from(
                    new Set(users.map((u) => u.dept).filter(Boolean)),
                  ).map((d) => (
                    <option key={d as string} value={d as string}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <span className="block text-xs font-medium text-muted-foreground">
                  Filter by Role
                </span>
                <select
                  className="w-40 rounded-md border border-input bg-background px-3 py-1.5 text-xs"
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                >
                  <option value="">All</option>
                  {Array.from(
                    new Set(users.map((u) => u.role).filter(Boolean)),
                  ).map((r) => (
                    <option key={r as string} value={r as string}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {(() => {
            let filtered = users;
            if (searchTerm) {
              const lower = searchTerm.toLowerCase();
              filtered = filtered.filter(
                (u) =>
                  u.name.toLowerCase().includes(lower) ||
                  u.usn.toLowerCase().includes(lower),
              );
            }
            if (filterBatch) {
              filtered = filtered.filter((u) => u.batch === filterBatch);
            }
            if (filterDept) {
              filtered = filtered.filter((u) => u.dept === filterDept);
            }
            if (filterRole) {
              filtered = filtered.filter((u) => u.role === filterRole);
            }

            if (loading) {
              return (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading users...
                </div>
              );
            }

            if (filtered.length === 0) {
              return (
                <div className="py-8 text-center text-muted-foreground">
                  No users found. Create a user above or adjust filters.
                </div>
              );
            }

            return (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>USN</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Batch</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Auth Account</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.name}</TableCell>
                      <TableCell>{u.usn}</TableCell>
                      <TableCell>{u.email || "-"}</TableCell>
                      <TableCell>{u.role || "-"}</TableCell>
                      <TableCell>{u.batch || "-"}</TableCell>
                      <TableCell>{u.dept || "-"}</TableCell>
                      <TableCell>
                        <Badge
                          variant={u.hasAuthUser ? "default" : "secondary"}
                        >
                          {u.hasAuthUser ? "Linked" : "No Account"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingUser({ ...u });
                              setIsEditDialogOpen(true);
                            }}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Are you absolutely sure?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete the user "
                                  <strong>{u.name}</strong>" (USN: {u.usn}),
                                  their auth account, and all their candidate
                                  records.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(u.usn)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  {deletingUsn === u.usn
                                    ? "Deleting..."
                                    : "Delete"}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            );
          })()}
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User Details</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4 py-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Full Name</Label>
                <Input
                  id="edit-name"
                  value={editingUser?.name || ""}
                  onChange={(e) =>
                    setEditingUser((prev) =>
                      prev ? { ...prev, name: e.target.value } : null,
                    )
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-usn">USN (Not editable)</Label>
                <Input id="edit-usn" value={editingUser?.usn || ""} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editingUser?.email || ""}
                  onChange={(e) =>
                    setEditingUser((prev) =>
                      prev ? { ...prev, email: e.target.value } : null,
                    )
                  }
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-batch">Batch</Label>
                  <Input
                    id="edit-batch"
                    value={editingUser?.batch || ""}
                    onChange={(e) =>
                      setEditingUser((prev) =>
                        prev ? { ...prev, batch: e.target.value } : null,
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-dept">Department</Label>
                  <Input
                    id="edit-dept"
                    value={editingUser?.dept || ""}
                    onChange={(e) =>
                      setEditingUser((prev) =>
                        prev ? { ...prev, dept: e.target.value } : null,
                      )
                    }
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updating}>
                {updating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
