'use client';
import { useEffect, useState } from 'react';
import { apiService, type ApiUser } from '../lib/api';
import { useApp } from '../context/AppContext';

export function AdminRolesManager() {
  const { currentUser, showToast } = useApp();
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<Record<string, ApiUser['role']>>({});
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let cancelled = false;
    apiService.getUsers().then(rows => { if (!cancelled) setUsers(rows); })
      .catch(error => { if (!cancelled) setError(error.message); }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);
  async function searchUsers(event: React.FormEvent) {
    event.preventDefault(); setLoading(true); setError('');
    try { setUsers(await apiService.getUsers(search)); setSelectedRoles({}); }
    catch (error) { setError(error instanceof Error ? error.message : 'Could not load users.'); }
    finally { setLoading(false); }
  }
  async function saveRole(user: ApiUser) {
    if (saving) return;
    setSaving(user.id); setError('');
    try {
      const updated = await apiService.updateUserRole(user.id, selectedRoles[user.id] || user.role);
      setUsers(rows => rows.map(row => row.id === updated.id ? updated : row));
      showToast(`Role updated for ${updated.email}.`, 'success');
    } catch (error) { setError(error instanceof Error ? error.message : 'Could not update role.'); }
    finally { setSaving(null); }
  }
  return <section aria-labelledby="roles-title" className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-7 space-y-4">
    <h2 id="roles-title" className="text-xl font-bold">User roles</h2>
    <p className="text-sm text-slate-600">Promote a registered student to admin, or remove admin access. You cannot change your own role. Showing up to 50 accounts; search by name or email.</p>
    <form onSubmit={searchUsers} className="flex gap-2"><label className="sr-only" htmlFor="user-search">Search users</label><input id="user-search" className="min-w-0 flex-1 rounded-xl border p-2.5 text-sm" placeholder="Name or email" value={search} onChange={e => setSearch(e.target.value)} /><button disabled={loading || saving !== null} className="rounded-xl bg-blue-700 px-4 text-sm font-bold text-white disabled:opacity-50">Search users</button></form>
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    {loading && <p role="status">Loading accounts…</p>}
    {!loading && !users.length && <p className="text-sm text-slate-500">No matching accounts.</p>}
    {users.map(user => <div key={user.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-3">
      <div><p className="font-semibold">{user.name}{user.id === currentUser?.id && ' (you)'}</p><p className="text-sm text-slate-500">{user.email}</p></div>
      <div className="flex gap-2"><label className="sr-only" htmlFor={`role-${user.id}`}>Role for {user.email}</label><select id={`role-${user.id}`} disabled={user.id === currentUser?.id || saving !== null} className="rounded-lg border p-2 text-sm" value={selectedRoles[user.id] || user.role} onChange={e => setSelectedRoles(roles => ({ ...roles, [user.id]: e.target.value as ApiUser['role'] }))}>
        <option value="STUDENT">Student</option><option value="ADMIN">Admin</option>
      </select><button type="button" disabled={user.id === currentUser?.id || saving !== null || !selectedRoles[user.id] || selectedRoles[user.id] === user.role} onClick={() => void saveRole(user)} className="rounded-lg bg-slate-900 px-3 text-sm font-bold text-white disabled:opacity-30">{saving === user.id ? 'Saving…' : 'Save role'}</button></div>
    </div>)}
  </section>;
}
