import { useState } from 'react'
import { 
  TrendingUp, 
  Receipt, 
  Boxes, 
  Clock, 
  Plus, 
  ArrowRight,
  Eye,
  Download,
  Construction,
  Layers,
  Settings
} from 'lucide-react'
import CategoriesPage from './CategoriesPage'
import AddMaterialPage from './AddMaterialPage'
import AllMaterialsPage from './AllMaterialsPage'
import ProfileSettingsPage from './ProfileSettingsPage'

export default function DashboardPage({ activeRoute, setActiveRoute, user, onUpdateUser }) {
  const [editingMaterialId, setEditingMaterialId] = useState(null)

  // Route handlers for direct pages
  if (activeRoute === 'categories') {
    return <CategoriesPage />
  }

  if (activeRoute === 'profile-settings' || activeRoute === 'profile') {
    return <ProfileSettingsPage user={user} onUpdateUser={onUpdateUser} />
  }

  if (activeRoute === 'add-material' || activeRoute === 'create-materials') {
    return (
      <AddMaterialPage
        editMaterialId={editingMaterialId}
        onSaved={() => {
          setEditingMaterialId(null)
          setActiveRoute('all-materials')
        }}
        setActiveRoute={(route) => {
          setEditingMaterialId(null)
          setActiveRoute(route)
        }}
      />
    )
  }

  if (activeRoute === 'all-materials' || activeRoute === 'materials') {
    return (
      <AllMaterialsPage
        setActiveRoute={setActiveRoute}
        onEditMaterial={(id) => {
          setEditingMaterialId(id)
          setActiveRoute('add-material')
        }}
      />
    )
  }


  // Breadcrumb & Page Info mapper
  const getPageInfo = () => {
    switch (activeRoute) {
      case 'create-bill':
        return { title: 'CREATE BILL', path: ['Bills', 'Create Bill'], icon: Receipt }
      case 'all-bills':
        return { title: 'ALL BILLS', path: ['Bills', 'All Bills'], icon: Receipt }
      case 'profile-settings':
        return { title: 'PROFILE SETTINGS', path: ['Settings', 'Profile Settings'], icon: Settings }
      case 'system-settings':
        return { title: 'SYSTEM SETTINGS', path: ['Settings', 'System Settings'], icon: Settings }
      default:
        return { title: 'DASHBOARD', path: ['Home', 'Dashboard'], icon: TrendingUp }
    }
  }

  const { title, path, icon: RouteIcon } = getPageInfo()

  // Sample data for overview on Dashboard
  const stats = [
    {
      title: 'TOTAL REVENUE',
      value: '₹ 2,48,750',
      change: '+18.4%',
      isPositive: true,
      icon: TrendingUp,
      color: 'from-[#043486] to-[#0248BC]'
    },
    {
      title: 'TOTAL BILLS',
      value: '384',
      change: '+12.5%',
      isPositive: true,
      icon: Receipt,
      color: 'from-blue-600 to-cyan-600'
    },
    {
      title: 'ACTIVE MATERIALS',
      value: '142',
      change: '+4 new',
      isPositive: true,
      icon: Boxes,
      color: 'from-emerald-600 to-teal-600'
    },
    {
      title: 'PENDING INVOICES',
      value: '18',
      change: '₹ 34,200',
      isPositive: false,
      icon: Clock,
      color: 'from-amber-500 to-orange-600'
    }
  ]

  const recentBills = [
    { id: 'INV-2026-001', customer: 'Senthil Enterprises', date: '11 Sep 2026', amount: '₹ 18,450', status: 'Paid' },
    { id: 'INV-2026-002', customer: 'Aroma Exports Pvt Ltd', date: '10 Sep 2026', amount: '₹ 42,000', status: 'Pending' },
    { id: 'INV-2026-003', customer: 'Kavitha Textiles', date: '09 Sep 2026', amount: '₹ 9,200', status: 'Paid' },
    { id: 'INV-2026-004', customer: 'Murugan Super Stores', date: '08 Sep 2026', amount: '₹ 27,600', status: 'Paid' },
    { id: 'INV-2026-005', customer: 'Vignesh Hardware', date: '08 Sep 2026', amount: '₹ 14,800', status: 'Draft' }
  ]

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Velzon Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
        <div>
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-[#292424] dark:text-white uppercase">
            {title}
          </h1>
        </div>
        <div className="flex items-center text-xs text-gray-500 dark:text-slate-400 gap-1.5 font-medium">
          {path.map((item, idx) => (
            <span key={idx} className="flex items-center gap-1.5">
              <span className={idx === path.length - 1 ? 'text-[#043486] dark:text-blue-400 font-semibold' : 'hover:text-gray-700 dark:hover:text-slate-200'}>
                {item}
              </span>
              {idx < path.length - 1 && <span>›</span>}
            </span>
          ))}
        </div>
      </div>

      {/* If on subpages: Clean "Coming Soon" Demo View */}
      {activeRoute !== 'dashboard' ? (
        <div className="bg-white dark:bg-slate-900 rounded-sm p-8 border border-gray-200/80 dark:border-slate-800 shadow-xs">
          <div className="max-w-md mx-auto text-center py-16">
            <div className="w-16 h-16 rounded-sm bg-blue-50 dark:bg-blue-950 text-[#043486] dark:text-blue-300 mx-auto flex items-center justify-center mb-4 border border-blue-100 dark:border-blue-900 shadow-xs">
              <RouteIcon size={30} />
            </div>
            <span className="inline-block px-3 py-1 rounded-sm text-[11px] font-semibold bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60 mb-2">
              Coming Soon
            </span>
            <h2 className="text-2xl font-bold text-[#292424] dark:text-white capitalize mt-1">
              {title.toLowerCase()}
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-gray-500 dark:text-slate-400 max-w-sm mx-auto">
              This module interface is ready. Next step-la namma backend API &amp; TiDB integration kooda connect panlam!
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <button
                onClick={() => setActiveRoute('dashboard')}
                className="px-5 py-2.5 rounded-sm bg-[#043486] hover:bg-[#0248BC] text-white font-semibold text-xs shadow-md shadow-blue-900/10 transition-all cursor-pointer"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Top 4 Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
            {stats.map((stat, index) => {
              const Icon = stat.icon
              return (
                <div
                  key={index}
                  className="bg-white dark:bg-slate-900 rounded-sm p-5 border border-gray-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-shadow duration-200 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-gray-400 dark:text-slate-400 tracking-wider">
                      {stat.title}
                    </span>
                    <div className={`w-10 h-10 rounded-sm bg-gradient-to-tr ${stat.color} text-white flex items-center justify-center shadow-xs`}>
                      <Icon size={18} />
                    </div>
                  </div>

                  <div className="mt-4 flex items-baseline justify-between">
                    <h3 className="text-2xl font-bold text-[#292424] dark:text-white tracking-tight">
                      {stat.value}
                    </h3>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-sm ${
                      stat.isPositive ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400' : 'bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400'
                    }`}>
                      {stat.change}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Quick Actions & Recent Invoices Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Quick Actions Card */}
            <div className="bg-white dark:bg-slate-900 rounded-sm p-6 border border-gray-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-[#292424] dark:text-white mb-1">
                  Quick Actions
                </h3>
                <p className="text-xs text-gray-400 dark:text-slate-400 mb-5">
                  Frequently used billing workflows
                </p>

                <div className="space-y-3">
                  <button
                    onClick={() => setActiveRoute('create-bill')}
                    className="w-full p-3.5 rounded-sm border border-gray-200 dark:border-slate-700 hover:border-[#0248BC] dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-slate-800/50 flex items-center justify-between transition-all group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-sm bg-blue-100 dark:bg-blue-950 text-[#043486] dark:text-blue-300 flex items-center justify-center group-hover:bg-[#043486] group-hover:text-white transition-colors">
                        <Plus size={16} />
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-bold text-[#292424] dark:text-white">Create New Bill</p>
                        <p className="text-[11px] text-gray-400 dark:text-slate-400">Generate tax invoice instantly</p>
                      </div>
                    </div>
                    <ArrowRight size={15} className="text-gray-400 dark:text-slate-500 group-hover:text-[#043486] dark:group-hover:text-blue-400 transition-colors" />
                  </button>

                  <button
                    onClick={() => setActiveRoute('materials')}
                    className="w-full p-3.5 rounded-sm border border-gray-200 dark:border-slate-700 hover:border-[#0248BC] dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-slate-800/50 flex items-center justify-between transition-all group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-sm bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 flex items-center justify-center group-hover:bg-emerald-700 group-hover:text-white transition-colors">
                        <Boxes size={16} />
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-bold text-[#292424] dark:text-white">Add Material / Stock</p>
                        <p className="text-[11px] text-gray-400 dark:text-slate-400">Inventory and raw goods</p>
                      </div>
                    </div>
                    <ArrowRight size={15} className="text-gray-400 dark:text-slate-500 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors" />
                  </button>

                  <button
                    onClick={() => setActiveRoute('categories')}
                    className="w-full p-3.5 rounded-sm border border-gray-200 dark:border-slate-700 hover:border-[#0248BC] dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-slate-800/50 flex items-center justify-between transition-all group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-sm bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 flex items-center justify-center group-hover:bg-purple-700 group-hover:text-white transition-colors">
                        <Plus size={16} />
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-bold text-[#292424] dark:text-white">Add New Category</p>
                        <p className="text-[11px] text-gray-400 dark:text-slate-400">Organize billing items</p>
                      </div>
                    </div>
                    <ArrowRight size={15} className="text-gray-400 dark:text-slate-500 group-hover:text-purple-700 dark:group-hover:text-purple-400 transition-colors" />
                  </button>
                </div>
              </div>

              {/* Status Box */}
              <div className="mt-6 p-4 rounded-sm bg-gradient-to-r from-[#043486] to-[#0248BC] text-white shadow-xs">
                <p className="text-xs font-semibold">Simcha Cloud Sync</p>
                <p className="text-[11px] text-blue-100 mt-0.5">TiDB Serverless Connection: Ready</p>
              </div>
            </div>

            {/* Recent Bills Table */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-sm p-6 border border-gray-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-bold text-[#292424] dark:text-white">
                      Recent Bills &amp; Invoices
                    </h3>
                    <p className="text-xs text-gray-400 dark:text-slate-400">
                      Latest customer transactions
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveRoute('all-bills')}
                    className="text-xs font-semibold text-[#0248BC] dark:text-blue-400 hover:text-[#043486] dark:hover:text-blue-300 hover:underline cursor-pointer"
                  >
                    View All Bills →
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-slate-800 text-gray-400 dark:text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                        <th className="py-3 px-2">Invoice ID</th>
                        <th className="py-3 px-2">Customer</th>
                        <th className="py-3 px-2">Date</th>
                        <th className="py-3 px-2">Amount</th>
                        <th className="py-3 px-2">Status</th>
                        <th className="py-3 px-2 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                      {recentBills.map((bill) => (
                        <tr key={bill.id} className="hover:bg-gray-50/80 dark:hover:bg-slate-800/60 transition-colors">
                          <td className="py-3.5 px-2 font-semibold text-[#043486] dark:text-blue-400">
                            {bill.id}
                          </td>
                          <td className="py-3.5 px-2 text-[#292424] dark:text-white font-medium">
                            {bill.customer}
                          </td>
                          <td className="py-3.5 px-2 text-gray-500 dark:text-slate-400">
                            {bill.date}
                          </td>
                          <td className="py-3.5 px-2 font-bold text-[#292424] dark:text-white">
                            {bill.amount}
                          </td>
                          <td className="py-3.5 px-2">
                            <span className={`px-2.5 py-1 rounded-sm text-[10px] font-semibold ${
                              bill.status === 'Paid'
                                ? 'bg-emerald-100/70 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400'
                                : bill.status === 'Pending'
                                ? 'bg-amber-100/70 dark:bg-amber-950/70 text-amber-700 dark:text-amber-400'
                                : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400'
                            }`}>
                              {bill.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-2 text-right">
                            <div className="flex items-center justify-end gap-1.5 text-gray-400 dark:text-slate-500">
                              <button className="p-1 hover:text-[#043486] dark:hover:text-blue-400 transition-colors cursor-pointer" title="View Bill">
                                <Eye size={15} />
                              </button>
                              <button className="p-1 hover:text-[#043486] dark:hover:text-blue-400 transition-colors cursor-pointer" title="Download PDF">
                                <Download size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

          </div>
        </>
      )}

    </div>
  )
}
