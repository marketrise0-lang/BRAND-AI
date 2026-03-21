import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  MoreVertical, 
  Mail, 
  Calendar, 
  Shield, 
  UserCheck, 
  UserPlus, 
  ChevronRight, 
  ChevronLeft,
  Trash2,
  Edit,
  ExternalLink
} from 'lucide-react';
import { subscribeToUsers } from '../services/adminService';
import { UserProfile } from '../../types';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

interface UserDirectoryProps {
  searchTerm?: string;
}

const UserDirectory: React.FC<UserDirectoryProps> = ({ searchTerm: globalSearchTerm = '' }) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [localSearchTerm, setLocalSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'user' | 'user_pro'>('all');

  useEffect(() => {
    const unsub = subscribeToUsers((data) => {
      setUsers(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const searchTerm = globalSearchTerm || localSearchTerm;

  const filteredUsers = users.filter(user => {
    const matchesSearch = (user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          user.email.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input 
            type="text" 
            placeholder="Search users by name or email..." 
            value={localSearchTerm}
            onChange={(e) => setLocalSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-emerald-500/50 transition-colors"
          />
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-1">
            <button 
              onClick={() => setFilterRole('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filterRole === 'all' ? 'bg-emerald-500 text-black' : 'text-white/60 hover:text-white'}`}
            >
              All
            </button>
            <button 
              onClick={() => setFilterRole('user')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filterRole === 'user' ? 'bg-emerald-500 text-black' : 'text-white/60 hover:text-white'}`}
            >
              Free
            </button>
            <button 
              onClick={() => setFilterRole('user_pro')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filterRole === 'user_pro' ? 'bg-emerald-500 text-black' : 'text-white/60 hover:text-white'}`}
            >
              Pro
            </button>
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 text-black rounded-xl font-bold text-sm hover:bg-emerald-400 transition-colors">
            <UserPlus className="w-4 h-4" />
            Add User
          </button>
        </div>
      </div>

      <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-white/40">User</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-white/40">Role</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-white/40">Registered</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-white/40">Status</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-white/40 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredUsers.map((user) => (
                <tr key={user.uid} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 font-bold">
                        {user.displayName?.[0] || 'U'}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{user.displayName || 'Anonymous'}</p>
                        <p className="text-xs text-white/40">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      user.role === 'user_pro' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-white/10 text-white/60'
                    }`}>
                      {user.role === 'user_pro' ? 'PRO' : 'FREE'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-white/60">
                      <Calendar className="w-3.5 h-3.5" />
                      {user.createdAt ? format(user.createdAt.toDate(), 'MMM d, yyyy') : 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                      <span className="text-sm text-white/60">Active</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white/60 hover:text-white transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-rose-500/10 text-white/60 hover:text-rose-500 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white/60 hover:text-white transition-colors">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredUsers.length === 0 && (
          <div className="text-center py-20 text-white/40">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="text-lg font-medium">No users found</p>
            <p className="text-sm">Try adjusting your search or filters</p>
          </div>
        )}

        <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between bg-white/5">
          <p className="text-xs text-white/40">
            Showing <span className="text-white font-medium">{filteredUsers.length}</span> of <span className="text-white font-medium">{users.length}</span> users
          </p>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/40 hover:text-white disabled:opacity-50" disabled>
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/40 hover:text-white disabled:opacity-50" disabled>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDirectory;
