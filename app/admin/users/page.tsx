'use client';

import { useState } from 'react';
import useSWR, { mutate } from 'swr';
import {
  Search, MoreHorizontal, UserPlus, Download, Mail, Ban,
  CheckCircle2, Shield, Bot,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { ROLE_LABELS, ROLE_COLORS, type Role } from '@/lib/permissions';
import { cn } from '@/lib/utils';

interface AdminUser {
  id: number;
  username: string;
  displayName: string;
  email: string;
  avatar: string;
  role: Role;
  status: 'active' | 'banned' | 'pending';
  isFake: boolean;
  joined: string;
  predictions: number;
  winRate: number;
  followers: number;
  lastActive: string;
}

const fetcher = (url: string) => fetch(url).then(r => r.json());
const ROLES: Role[] = ['admin', 'moderator', 'editor', 'tipster', 'user'];

export default function AdminUsersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | Role>('all');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'real' | 'fake'>('all');

  const params = new URLSearchParams();
  if (searchQuery) params.set('search', searchQuery);
  if (roleFilter !== 'all') params.set('role', roleFilter);
  if (sourceFilter !== 'all') params.set('source', sourceFilter);

  const url = `/api/admin/users?${params.toString()}`;
  const { data, isLoading } = useSWR<{
    users: AdminUser[];
    counts: { total: number; byRole: Record<Role, number> };
  }>(url, fetcher);

  const users = data?.users ?? [];
  const counts = data?.counts ?? { total: 0, byRole: { admin: 0, moderator: 0, editor: 0, tipster: 0, user: 0 } };

  async function changeRole(id: number, role: Role) {
    await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, role }),
    });
    mutate(url);
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-lg font-bold">Users Management</h1>
          <p className="text-muted-foreground">
            Manage users and assign roles. Moderators &amp; Editors get scoped admin access.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2"><Download className="h-4 w-4" />Export</Button>
          <Button className="gap-2"><UserPlus className="h-4 w-4" />Add user</Button>
        </div>
      </div>

      {/* Role counts */}
      <div className="grid gap-2 md:grid-cols-5">
        {ROLES.map(role => (
          <Card key={role}>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase text-muted-foreground">{ROLE_LABELS[role]}</span>
                <Badge variant="outline" className={cn('h-5 text-[10px]', ROLE_COLORS[role])}>
                  {role === 'admin' ? <Shield className="mr-1 h-2.5 w-2.5" /> : null}
                  {counts.byRole[role] ?? 0}
                </Badge>
              </div>
              <div className="mt-1 text-lg font-bold">{counts.byRole[role] ?? 0}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search users by name, handle or email..."
                     value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                     className="pl-9" />
            </div>
            <div className="flex gap-2">
              <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as 'all' | Role)}>
                <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All roles</SelectItem>
                  {ROLES.map(r => <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={sourceFilter} onValueChange={(v) => setSourceFilter(v as 'all' | 'real' | 'fake')}>
                <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All sources</SelectItem>
                  <SelectItem value="real">Real signups</SelectItem>
                  <SelectItem value="fake">Seeded</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex h-40 items-center justify-center"><Spinner className="h-8 w-8" /></div>
          ) : users.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">No users match those filters.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50 text-left text-xs uppercase text-muted-foreground">
                    <th className="p-3 font-medium">User</th>
                    <th className="p-3 font-medium">Role</th>
                    <th className="p-3 font-medium">Source</th>
                    <th className="p-3 font-medium text-right">Tips</th>
                    <th className="p-3 font-medium text-right">Win&nbsp;%</th>
                    <th className="p-3 font-medium">Joined</th>
                    <th className="p-3 font-medium">Last seen</th>
                    <th className="p-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={user.avatar} alt="" className="h-9 w-9 rounded-full bg-muted" />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{user.displayName}</p>
                            <p className="truncate text-xs text-muted-foreground">@{user.username} · {user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <Select value={user.role} onValueChange={(v) => changeRole(user.id, v as Role)}>
                          <SelectTrigger className={cn('h-8 w-32 px-2 text-xs', ROLE_COLORS[user.role])}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ROLES.map(r => <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-3">
                        <Badge variant="outline" className={cn(
                          'text-[10px]',
                          user.isFake ? 'border-purple-500/30 text-purple-500' : 'border-emerald-500/30 text-emerald-500',
                        )}>
                          {user.isFake ? <><Bot className="mr-1 h-2.5 w-2.5" />Seeded</> : 'Real'}
                        </Badge>
                      </td>
                      <td className="p-3 text-right text-sm">{user.predictions}</td>
                      <td className="p-3 text-right text-sm">
                        <span className={user.winRate >= 60 ? 'text-emerald-500' : user.winRate >= 50 ? 'text-amber-500' : 'text-red-500'}>
                          {user.winRate}%
                        </span>
                      </td>
                      <td className="p-3 text-xs text-muted-foreground">{user.joined}</td>
                      <td className="p-3 text-xs">
                        <span className={user.lastActive === 'Online' ? 'text-emerald-500' : 'text-muted-foreground'}>
                          {user.lastActive}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem><Mail className="mr-2 h-4 w-4" />Email user</DropdownMenuItem>
                            <DropdownMenuItem><CheckCircle2 className="mr-2 h-4 w-4" />Verify</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-500"><Ban className="mr-2 h-4 w-4" />Ban user</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
