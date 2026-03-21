import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Search, 
  Filter, 
  MoreVertical, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Calendar, 
  User, 
  Zap, 
  Shield, 
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Settings,
  X,
  Loader2
} from 'lucide-react';
import { subscribeToSubscriptions } from '../services/adminService';
import { Subscription } from '../../types';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

const SubscriptionManager: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlan, setFilterPlan] = useState<'all' | 'free' | 'pro'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSub, setSelectedSub] = useState<Subscription | null>(null);

  useEffect(() => {
    const unsub = subscribeToSubscriptions((data) => {
      setSubscriptions(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const filteredSubs = subscriptions.filter(sub => {
    const matchesSearch = sub.userId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlan = filterPlan === 'all' || sub.plan === filterPlan;
    return matchesSearch && matchesPlan;
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
            placeholder="Search by User ID..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-emerald-500/50 transition-colors"
          />
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-1">
            <button 
              onClick={() => setFilterPlan('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filterPlan === 'all' ? 'bg-emerald-500 text-black' : 'text-white/60 hover:text-white'}`}
            >
              All
            </button>
            <button 
              onClick={() => setFilterPlan('free')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filterPlan === 'free' ? 'bg-emerald-500 text-black' : 'text-white/60 hover:text-white'}`}
            >
              Free
            </button>
            <button 
              onClick={() => setFilterPlan('pro')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filterPlan === 'pro' ? 'bg-emerald-500 text-black' : 'text-white/60 hover:text-white'}`}
            >
              Pro
            </button>
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 text-white/60 rounded-xl font-bold text-sm hover:bg-white/10 transition-colors">
            <Settings className="w-4 h-4" />
            Pricing Plans
          </button>
        </div>
      </div>

      <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-white/40">User ID</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-white/40">Plan</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-white/40">Status</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-white/40">Started</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-white/40">Expires</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-white/40 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredSubs.map((sub) => (
                <tr key={sub.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/40">
                        <User className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-medium truncate max-w-[120px]">{sub.userId}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {sub.plan === 'pro' ? (
                        <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                          <Zap className="w-3.5 h-3.5 fill-emerald-500" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center text-white/40">
                          <Shield className="w-3.5 h-3.5" />
                        </div>
                      )}
                      <span className={`text-sm font-bold ${sub.plan === 'pro' ? 'text-emerald-500' : 'text-white/60'}`}>
                        {sub.plan.toUpperCase()}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      sub.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                    }`}>
                      {sub.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-white/60">
                      <Calendar className="w-3.5 h-3.5" />
                      {sub.startedAt ? format(sub.startedAt.toDate(), 'MMM d, yyyy') : 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-white/60">
                      <Clock className="w-3.5 h-3.5" />
                      {sub.expiresAt ? format(sub.expiresAt.toDate(), 'MMM d, yyyy') : 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => {
                        setSelectedSub(sub);
                        setIsModalOpen(true);
                      }}
                      className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredSubs.length === 0 && (
          <div className="text-center py-20 text-white/40">
            <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="text-lg font-medium">No subscriptions found</p>
            <p className="text-sm">Try adjusting your search or filters</p>
          </div>
        )}
      </div>

      {/* Update Plan Modal */}
      <AnimatePresence>
        {isModalOpen && selectedSub && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-[#0A0A0A] border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <h3 className="text-xl font-bold">Manage Subscription</h3>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 rounded-full hover:bg-white/5 text-white/40 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/40">User ID</span>
                    <span className="font-mono">{selectedSub.userId}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/40">Current Plan</span>
                    <span className="font-bold text-emerald-500 uppercase">{selectedSub.plan}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/40">Status</span>
                    <span className="font-bold text-emerald-500 uppercase">{selectedSub.status}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/40">Update Plan Status</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button className="py-3 rounded-xl bg-emerald-500 text-black font-bold text-sm hover:bg-emerald-400 transition-colors">
                      Activate
                    </button>
                    <button className="py-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 font-bold text-sm hover:bg-rose-500/20 transition-colors">
                      Cancel
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/40">Change Plan Type</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button className="py-3 rounded-xl bg-white/5 border border-white/10 text-white/60 font-bold text-sm hover:bg-white/10 transition-colors">
                      Downgrade to Free
                    </button>
                    <button className="py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 font-bold text-sm hover:bg-emerald-500/20 transition-colors">
                      Upgrade to Pro
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="p-6 bg-white/5 border-t border-white/10 flex gap-3">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 font-bold text-sm hover:bg-white/10 transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SubscriptionManager;
