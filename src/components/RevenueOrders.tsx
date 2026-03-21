import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Search, 
  Filter, 
  MoreVertical, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Calendar, 
  User, 
  CreditCard, 
  Smartphone,
  ChevronRight,
  ChevronLeft,
  Download,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Package
} from 'lucide-react';
import { subscribeToOrders } from '../services/adminService';
import { Order } from '../../types';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

const RevenueOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'pending' | 'failed'>('all');

  useEffect(() => {
    const unsub = subscribeToOrders((data) => {
      setOrders(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.userId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || order.paymentStatus === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const totalRevenue = orders
    .filter(o => o.paymentStatus === 'paid')
    .reduce((sum, o) => sum + o.amount, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <DollarSign className="w-6 h-6" />
            </div>
            <div className="flex items-center gap-1 text-xs font-bold text-emerald-500">
              <ArrowUpRight className="w-3 h-3" />
              +24%
            </div>
          </div>
          <p className="text-sm text-white/40 font-medium">Total Revenue</p>
          <h4 className="text-3xl font-bold mt-1 tracking-tight">{totalRevenue} €</h4>
        </div>

        <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
              <Package className="w-6 h-6" />
            </div>
            <div className="flex items-center gap-1 text-xs font-bold text-emerald-500">
              <ArrowUpRight className="w-3 h-3" />
              +12%
            </div>
          </div>
          <p className="text-sm text-white/40 font-medium">Total Orders</p>
          <h4 className="text-3xl font-bold mt-1 tracking-tight">{orders.length}</h4>
        </div>

        <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-500">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div className="flex items-center gap-1 text-xs font-bold text-emerald-500">
              <ArrowUpRight className="w-3 h-3" />
              +8%
            </div>
          </div>
          <p className="text-sm text-white/40 font-medium">Avg. Order Value</p>
          <h4 className="text-3xl font-bold mt-1 tracking-tight">{(totalRevenue / (orders.filter(o => o.paymentStatus === 'paid').length || 1)).toFixed(2)} €</h4>
        </div>
      </div>

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
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500/50 transition-colors"
          >
            <option value="all">All Status</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 text-white/60 rounded-xl font-bold text-sm hover:bg-white/10 transition-colors">
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-white/40">Order ID</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-white/40">User</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-white/40">Amount</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-white/40">Method</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-white/40">Status</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-white/40">Date</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-white/40 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4">
                    <span className="text-xs font-mono text-white/40">#{order.id.slice(0, 8)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/40">
                        <User className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-medium truncate max-w-[120px]">{order.userId}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-white">{order.amount} {order.currency}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-white/60">
                      {order.paymentMethod === 'card' ? <CreditCard className="w-3.5 h-3.5" /> : <Smartphone className="w-3.5 h-3.5" />}
                      <span className="capitalize">{order.paymentMethod}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      order.paymentStatus === 'paid' ? 'bg-emerald-500/10 text-emerald-500' : 
                      order.paymentStatus === 'pending' ? 'bg-amber-500/10 text-amber-500' : 'bg-rose-500/10 text-rose-500'
                    }`}>
                      {order.paymentStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-white/60">
                      <Calendar className="w-3.5 h-3.5" />
                      {order.createdAt ? format(order.createdAt.toDate(), 'MMM d, HH:mm') : 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white/60 hover:text-white transition-colors">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredOrders.length === 0 && (
          <div className="text-center py-20 text-white/40">
            <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="text-lg font-medium">No orders found</p>
            <p className="text-sm">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RevenueOrders;
