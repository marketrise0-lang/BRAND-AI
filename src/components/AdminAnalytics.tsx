import React from 'react';
import { 
  TrendingUp, 
  Users, 
  Layers, 
  CreditCard, 
  DollarSign, 
  BarChart3, 
  PieChart, 
  Activity,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { motion } from 'framer-motion';

const AdminAnalytics: React.FC = () => {
  // Mock data for charts (in a real app, these would come from Firestore aggregations)
  const growthStats = [
    { label: 'User Growth', value: '+12.5%', icon: Users, color: 'emerald' },
    { label: 'Design Volume', value: '+45.2%', icon: Layers, color: 'blue' },
    { label: 'Revenue Growth', value: '+18.7%', icon: DollarSign, color: 'amber' },
    { label: 'Conversion Rate', value: '3.2%', icon: TrendingUp, color: 'violet' },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {growthStats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-xl bg-${stat.color}-500/10 flex items-center justify-center text-${stat.color}-500`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <span className="text-sm text-white/40 font-medium">{stat.label}</span>
            </div>
            <div className="flex items-end justify-between">
              <h4 className="text-2xl font-bold tracking-tight">{stat.value}</h4>
              <div className="flex items-center gap-1 text-xs font-bold text-emerald-500 mb-1">
                <ArrowUpRight className="w-3 h-3" />
                Monthly
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-[#0A0A0A] border border-white/10 rounded-2xl p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-bold">Platform Usage</h3>
              <p className="text-sm text-white/40">Daily active users and design generations</p>
            </div>
            <select className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-emerald-500/50 transition-colors">
              <option>Last 30 Days</option>
              <option>Last 90 Days</option>
              <option>Last Year</option>
            </select>
          </div>
          
          <div className="h-64 flex items-end justify-between gap-2">
            {[45, 60, 55, 80, 70, 90, 85, 100, 95, 110, 105, 120].map((height, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                <div className="w-full bg-emerald-500/10 rounded-t-lg relative overflow-hidden group-hover:bg-emerald-500/20 transition-colors" style={{ height: `${height}%` }}>
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: '100%' }}
                    transition={{ delay: i * 0.05, duration: 1 }}
                    className="absolute bottom-0 left-0 right-0 bg-emerald-500/40"
                  />
                </div>
                <span className="text-[10px] text-white/20">Day {i + 1}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-8">
          <h3 className="text-xl font-bold mb-8">Revenue by Plan</h3>
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-white/60">Pro Plan</span>
                <span className="font-bold">78%</span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '78%' }}
                  className="h-full bg-emerald-500"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-white/60">Enterprise</span>
                <span className="font-bold">15%</span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '15%' }}
                  className="h-full bg-blue-500"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-white/60">Add-ons</span>
                <span className="font-bold">7%</span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '7%' }}
                  className="h-full bg-violet-500"
                />
              </div>
            </div>
          </div>

          <div className="mt-12 p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
              <span className="text-sm font-bold text-emerald-500">Growth Insight</span>
            </div>
            <p className="text-xs text-white/60 leading-relaxed">
              Pro plan conversions are up 12% this month. Consider launching a new template pack to maintain momentum.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
