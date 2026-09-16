import { useEffect, useState, type FormEvent } from 'react';
import { getMe, updateUser } from '../api/users';
import { getErrorMessage } from '../api/client';
import { Alert } from '../components/ui/alert';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { formatDate } from '../lib/utils';
import { useAuthStore } from '../stores/auth-store';

export function ProfilePage() {
  const currentUser = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      setLoading(true);
      setError(null);

      try {
        const user = await getMe();
        if (!active) return;
        setUser(user);
        setName(user.name);
        setEmail(user.email);
      } catch (err) {
        if (active) setError(getErrorMessage(err, 'Failed to load profile'));
      } finally {
        if (active) setLoading(false);
      }
    }

    loadProfile();
    return () => {
      active = false;
    };
  }, [setUser]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!currentUser) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const payload: { name?: string; email?: string; password?: string } = { name, email };
      if (password.trim()) payload.password = password;

      const updated = await updateUser(currentUser.id, payload);
      setUser(updated);
      setPassword('');
      setSuccess('Profile updated successfully.');
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to update profile'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Profile</CardTitle>
        <CardDescription>View and update your account via the Week 1 API.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-[var(--color-muted-foreground)]">Loading profile…</p>
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && <Alert variant="destructive">{error}</Alert>}
            {success && <Alert>{success}</Alert>}

            {currentUser && (
              <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--color-muted-foreground)]">
                <Badge variant={currentUser.role === 'ADMIN' ? 'default' : 'secondary'}>
                  {currentUser.role}
                </Badge>
                <span>Joined {formatDate(currentUser.createdAt)}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="profile-name">Name</Label>
              <Input
                id="profile-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-email">Email</Label>
              <Input
                id="profile-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-password">New password (optional)</Label>
              <Input
                id="profile-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={8}
                placeholder="Leave blank to keep current password"
              />
            </div>

            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
