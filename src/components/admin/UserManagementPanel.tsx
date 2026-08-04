'use client';

import { useState } from 'react';
import { useAdminUsers } from '@/hooks/useAdminUsers';
import { SUPER_ADMIN_EMAIL } from '@/lib/constants';

export default function UserManagementPanel() {
  const { users, loading, error, changeRole, deleteUser } = useAdminUsers();
  const [deleting, setDeleting] = useState<string | null>(null);
  const [changing, setChanging] = useState<string | null>(null);

  const handleDelete = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    setDeleting(userId);
    await deleteUser(userId);
    setDeleting(null);
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    setChanging(userId);
    await changeRole(userId, newRole);
    setChanging(null);
  };

  if (loading) return <div className="text-center text-gray-600">Loading users...</div>;
  if (error) return <div className="text-red-600">Error: {error}</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">User Management ({users.length})</h3>
        <button
          onClick={() => window.location.reload()}
          className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600 transition"
        >
          🔄 Refresh
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-gray-300">
              <th className="text-left py-2 px-3">Email</th>
              <th className="text-left py-2 px-3">Name</th>
              <th className="text-left py-2 px-3">Role</th>
              <th className="text-left py-2 px-3">Location</th>
              <th className="text-left py-2 px-3">Joined</th>
              <th className="text-left py-2 px-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => {
              const isHardcodedSuperAdmin = user.email === SUPER_ADMIN_EMAIL;
              return (
                <tr key={user.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="py-2 px-3">{user.email}</td>
                  <td className="py-2 px-3">{user.name || '-'}</td>
                  <td className="py-2 px-3">
                    {isHardcodedSuperAdmin ? (
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded font-semibold">
                        super_admin 👑
                      </span>
                    ) : (
                      <select
                        value={user.role || 'user'}
                        onChange={e => handleRoleChange(user.id, e.target.value)}
                        disabled={changing === user.id}
                        className="px-2 py-1 border border-gray-300 rounded bg-white cursor-pointer"
                      >
                        <option value="user">user</option>
                        <option value="admin">admin</option>
                        <option value="super_admin">super_admin</option>
                      </select>
                    )}
                  </td>
                  <td className="py-2 px-3 text-gray-600">
                    {user.country ? `${user.city || ''}${user.city ? ', ' : ''}${user.country}` : '-'}
                  </td>
                  <td className="py-2 px-3 text-gray-600 text-xs">
                    {user.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}
                  </td>
                  <td className="py-2 px-3">
                    {!isHardcodedSuperAdmin && (
                      <button
                        onClick={() => handleDelete(user.id)}
                        disabled={deleting === user.id}
                        className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 disabled:opacity-50 transition"
                      >
                        {deleting === user.id ? '...' : 'Delete'}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
