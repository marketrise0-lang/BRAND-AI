import React from 'react';
import { 
  Users, 
  Layers, 
  CreditCard, 
  DollarSign, 
  Package, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight 
} from 'lucide-react';
import { AdminMetrics } from '../../types';
import { motion } from 'framer-motion';

interface AdminMetricsCardsProps {
  metrics: AdminMetrics;
}

const AdminMetricsCards: React.FC<AdminMetricsCardsProps> = ({ metrics }) => {
  const cards = [
    {
      title: 'Total Users',
      value: metrics.totalUsers,
      icon: Users,
      color: 'emerald',
      trend: '+12%',
      trendUp: true,
    },
    {
      title: 'Total Designs',
      value: metrics.totalDesigns,
      icon: Layers,
      color: 'blue',
      trend: '+24%',
      trendUp: true,
    },
    {
      title: 'Active Subscriptions',
      value: metrics.activeSubscriptions,
      icon: CreditCard,
      color: 'violet',
      trend: '+8%',
      trendUp: true,
    },
    {
      title: 'Total Revenue',
      value: `${metrics.totalRevenue} €`,
      icon: DollarSign,
      color: 'amber',
      trend: '+18%',
      trendUp: true,
    },
    {
      title: 'New Orders Today',
      value: metrics.newOrdersToday,
      icon: Package,
      color: 'rose',
      trend: '-2%',
      trendUp: false,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
      {cards.map((card, index) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.1 }}
          className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all group"
        >
          <div className="flex items-center justify-between mb-4">
            <div className={`w-12 h-12 rounded-xl bg-${card.color}-500/10 flex items-center justify-center text-${card.color}-500 group-hover:scale-110 transition-transform`}>
              <card.icon className="w-6 h-6" />
            </div>
            <div className={`flex items-center gap-1 text-xs font-bold ${card.trendUp ? 'text-emerald-500' : 'text-rose-500'}`}>
              {card.trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {card.trend}
            </div>
          </div>
          <div>
            <p className="text-sm text-white/40 font-medium">{card.title}</p>
            <h4 className="text-2xl font-bold mt-1 tracking-tight">{card.value}</h4>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default AdminMetricsCards;
