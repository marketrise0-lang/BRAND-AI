import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Layout, 
  CreditCard, 
  FileText, 
  BarChart3, 
  Settings, 
  Plus, 
  Edit, 
  Trash2, 
  ExternalLink, 
  CheckCircle2, 
  XCircle, 
  Clock,
  TrendingUp,
  Package,
  Search,
  Filter,
  MoreVertical,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Briefcase,
  Layers,
  PenTool,
  BookOpen,
  Home as HomeIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { 
  subscribeToAdminMetrics, 
  subscribeToUsers, 
  subscribeToAllProjects, 
  subscribeToTemplates, 
  subscribeToPosts, 
  subscribeToOrders, 
  subscribeToSubscriptions,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  createPost,
  updatePost
} from '../services/adminService';
import { 
  AdminMetrics, 
  UserProfile, 
  Project, 
  Template, 
  Post, 
  Order, 
  Subscription 
} from '../../types';
import { format } from 'date-fns';

// Sub-components
import AdminMetricsCards from './AdminMetricsCards';
import UserDirectory from './UserDirectory';
import ProjectManager from './ProjectManager';
import TemplateManager from './TemplateManager';
import SubscriptionManager from './SubscriptionManager';
import RevenueOrders from './RevenueOrders';
import BlogCMS from './BlogCMS';
import AdminAnalytics from './AdminAnalytics';

type AdminTab = 'dashboard' | 'users' | 'projects' | 'templates' | 'subscriptions' | 'revenue' | 'blog' | 'analytics';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');

  useEffect(() => {
    if (!user) return;

    const unsubMetrics = subscribeToAdminMetrics((data) => {
      setMetrics(data);
      setLoading(false);
    });

    return () => {
      unsubMetrics();
    };
  }, [user]);

  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'users', label: 'User Directory', icon: Users },
    { id: 'projects', label: 'Manage Projects', icon: Layers },
    { id: 'templates', label: 'Template Manager', icon: PenTool },
    { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard },
    { id: 'revenue', label: 'Revenue & Orders', icon: DollarSign },
    { id: 'blog', label: 'Blog CMS', icon: BookOpen },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#050505]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#050505] text-white">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/10 bg-[#0A0A0A] hidden lg:block">
        <div className="p-6">
          <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <Settings className="w-5 h-5 text-black" />
            </div>
            Admin Panel
          </h2>
        </div>
        
        <nav className="mt-4 px-4 space-y-1">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as AdminTab)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                activeTab === item.id 
                  ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
              {activeTab === item.id && (
                <motion.div 
                  layoutId="activeTab"
                  className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500"
                />
              )}
            </button>
          ))}
          
          <div className="pt-4 mt-4 border-t border-white/5">
            <button
              onClick={() => navigate('/')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/60 hover:text-white hover:bg-white/5 transition-all duration-200"
            >
              <HomeIcon className="w-5 h-5" />
              <span className="font-medium">Back to App</span>
            </button>
          </div>
        </nav>

        <div className="absolute bottom-0 w-64 p-6 border-t border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500 font-bold">
              {user?.displayName?.[0] || 'A'}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate">{user?.displayName || 'Admin User'}</p>
              <p className="text-xs text-white/40 truncate">{user?.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="h-20 border-b border-white/10 bg-[#0A0A0A]/50 backdrop-blur-xl flex items-center justify-between px-8 sticky top-0 z-10">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {sidebarItems.find(i => i.id === activeTab)?.label}
            </h1>
            <p className="text-sm text-white/40">Manage your platform and monitor growth</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
              <input 
                type="text" 
                placeholder="Search anything..." 
                value={globalSearchTerm}
                onChange={(e) => setGlobalSearchTerm(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-emerald-500/50 transition-colors w-64"
              />
            </div>
            <button 
              onClick={() => alert("Settings panel coming soon")}
              className="p-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
            >
              <Settings className="w-5 h-5 text-white/60" />
            </button>
          </div>
        </header>

        <div className="p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'dashboard' && metrics && (
                <div className="space-y-8">
                  <AdminMetricsCards metrics={metrics} />
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-6">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold">Recent Sales</h3>
                        <button 
                          onClick={() => setActiveTab('revenue')}
                          className="text-emerald-500 text-sm font-medium hover:underline flex items-center gap-1"
                        >
                          View all <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="space-y-4">
                        {metrics.recentSales.map((order) => (
                          <div key={order.id} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                <DollarSign className="w-5 h-5" />
                              </div>
                              <div>
                                <p className="font-medium">{order.amount} {order.currency}</p>
                                <p className="text-xs text-white/40">{format(order.createdAt.toDate(), 'MMM d, HH:mm')}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-bold uppercase tracking-wider">
                                {order.paymentStatus}
                              </span>
                              <p className="text-xs text-white/40 mt-1">{order.paymentMethod}</p>
                            </div>
                          </div>
                        ))}
                        {metrics.recentSales.length === 0 && (
                          <div className="text-center py-12 text-white/40">
                            <Package className="w-12 h-12 mx-auto mb-4 opacity-20" />
                            <p>No recent sales found</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-6">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold">Popular Design Type</h3>
                        <div className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-bold">
                          Real-time
                        </div>
                      </div>
                      <div className="flex flex-col items-center justify-center py-12">
                        <div className="w-32 h-32 rounded-full border-4 border-emerald-500/20 flex items-center justify-center relative">
                          <div className="absolute inset-0 rounded-full border-t-4 border-emerald-500 animate-spin-slow"></div>
                          <PenTool className="w-12 h-12 text-emerald-500" />
                        </div>
                        <h4 className="text-3xl font-bold mt-6 capitalize">{metrics.popularDesignType}</h4>
                        <p className="text-white/40 mt-2">Most generated asset category</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'users' && <UserDirectory searchTerm={globalSearchTerm} />}
              {activeTab === 'projects' && <ProjectManager searchTerm={globalSearchTerm} />}
              {activeTab === 'templates' && <TemplateManager />}
              {activeTab === 'subscriptions' && <SubscriptionManager />}
              {activeTab === 'revenue' && <RevenueOrders />}
              {activeTab === 'blog' && <BlogCMS />}
              {activeTab === 'analytics' && <AdminAnalytics />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
