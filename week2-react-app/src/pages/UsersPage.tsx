import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { register } from '../api/auth';
import { deleteUser, listUsers, updateUser } from '../api/users';
import { getErrorMessage } from '../api/client';
import { Alert } from '../components/ui/alert';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { formatDate } from '../lib/utils';
import type { Role, User } from '../types/user';

type DialogMode = 'create' | 'edit' | null;

export function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('USER');

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listUsers();
      setUsers(data);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load users'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const openCreateDialog = () => {
    setDialogMode('create');
    setSelectedUser(null);
    setName('');
    setEmail('');
    setPassword('');
    setRole('USER');
  };

  const openEditDialog = (user: User) => {
    setDialogMode('edit');
    setSelectedUser(user);
    setName(user.name);
    setEmail(user.email);
    setPassword('');
    setRole(user.role);
  };

  const closeDialog = () => {
    setDialogMode(null);
    setSelectedUser(null);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (dialogMode === 'create') {
        await register({ name, email, password });
      } else if (dialogMode === 'edit' && selectedUser) {
        const payload: { name: string; email: string; role: Role; password?: string } = {
          name,
          email,
          role,
        };
        if (password.trim()) payload.password = password;
        await updateUser(selectedUser.id, payload);
      }
      closeDialog();
      await loadUsers();
    } catch (err) {
      setError(getErrorMessage(err, 'Request failed'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (user: User) => {
    const confirmed = window.confirm(`Delete ${user.email}?`);
    if (!confirmed) return;

    setError(null);
    try {
      await deleteUser(user.id);
      await loadUsers();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to delete user'));
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>User Management</CardTitle>
            <CardDescription>Admin-only CRUD connected to the Week 1 API.</CardDescription>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4" />
            Add user
          </Button>
        </CardHeader>
        <CardContent>
          {error && !dialogMode && <Alert variant="destructive" className="mb-4">{error}</Alert>}

          {loading ? (
            <p className="text-sm text-[var(--color-muted-foreground)]">Loading users…</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-[var(--color-border)]">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-[var(--color-muted)]">
                  <tr>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">Role</th>
                    <th className="px-4 py-3 font-medium">Updated</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-t border-[var(--color-border)]">
                      <td className="px-4 py-3">{user.name}</td>
                      <td className="px-4 py-3">{user.email}</td>
                      <td className="px-4 py-3">
                        <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'}>
                          {user.role}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-[var(--color-muted-foreground)]">
                        {formatDate(user.updatedAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => openEditDialog(user)}>
                            <Pencil className="h-4 w-4" />
                            Edit
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => handleDelete(user)}>
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogMode !== null} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogMode === 'create' ? 'Create user' : 'Edit user'}</DialogTitle>
            <DialogDescription>
              {dialogMode === 'create'
                ? 'Creates a USER account via POST /api/auth/register.'
                : 'Updates the selected user via PATCH /api/users/:id.'}
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && dialogMode && <Alert variant="destructive">{error}</Alert>}

            <div className="space-y-2">
              <Label htmlFor="user-name">Name</Label>
              <Input
                id="user-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="user-email">Email</Label>
              <Input
                id="user-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="user-password">
                Password {dialogMode === 'edit' ? '(optional)' : ''}
              </Label>
              <Input
                id="user-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={dialogMode === 'create' ? 8 : undefined}
                required={dialogMode === 'create'}
              />
            </div>

            {dialogMode === 'edit' && (
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={role} onValueChange={(value) => setRole(value as Role)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USER">USER</SelectItem>
                    <SelectItem value="ADMIN">ADMIN</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Saving…' : dialogMode === 'create' ? 'Create' : 'Save'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
