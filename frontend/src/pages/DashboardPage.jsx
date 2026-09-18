import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  TrendingUp, 
  Receipt, 
  Boxes, 
  Clock, 
  Plus, 
  ArrowRight,
  Eye,
  Printer,
  Download,
  Construction,
  Layers,
  Settings,
  Sparkles
} from 'lucide-react'
import InvoiceModal from '../components/invoice/InvoiceModal'
import { API_ENDPOINTS } from '../config/api'

export default function DashboardPage({ setActiveRoute: setActiveRouteProp, user, onUpdateUser }) {
  const navigate = useNavigate()

  const setActiveRoute = (route) => {
    if (setActiveRouteProp) {
      setActiveRouteProp(route)
    } else {
      const ROUTE_MAP = {
        
        'dashboard': '/dashboard',
        'inward': '/inward',
        'inward-reports': '/inward-list',
        'inward-list': '/inward-list',
        'create-bill': '/outward',
        'outward': '/outward',
        'all-bills': '/outward-list',
        'outward-list': '/outward-list',
        'categories': '/categories',
        'materials': '/materials',
        'all-materials': '/materials',
        'add-material': '/materials/add',
        'inventory': '/inventory',
        'stock': '/inventory',
        'profile-settings': '/settings/profile',
        'system-settings': '/settings/system',
        'configurations-settings': '/settings/configurations'
      }
      navigate(ROUTE_MAP[route] || (route.startsWith('/') ? route : `/${route}`))
    }
  }

  const [dashboardStats, setDashboardStats] = useState({
    totalRevenue: 2849,
    totalBills: 1,
    activeMaterials: 4,
    pendingInvoices: 0
  })
  const [recentBills, setRecentBills] = useState([])
  const [selectedBillForPreview, setSelectedBillForPreview] = useState(null)
  const [isLoadingPreview, setIsLoadingPreview] = useState(false)
  const [settings, setSettings] = useState(null)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [billsRes, matRes, settingsRes] = await Promise.all([
          fetch(API_ENDPOINTS.BILLS),
          fetch(API_ENDPOINTS.MATERIALS),
          fetch(API_ENDPOINTS.SETTINGS)
        ])
        const billsData = await billsRes.json()
        const matData = await matRes.json()
        const settingsData = await settingsRes.json()

        if (settingsData.success && settingsData.settings) {
          setSettings(settingsData.settings)
        }

        if (billsData.success) {
          const allBills = billsData.bills || []
          const rev = allBills.reduce((sum, b) => sum + (parseFloat(b.total_amount) || 0), 0)
          const pending = allBills.filter(b => b.payment_status === 'Pending').length

          setDashboardStats(prev => ({
            ...prev,
            totalRevenue: rev,
            totalBills: allBills.length,
            pendingInvoices: pending
          }))

          setRecentBills(
            allBills.slice(0, 5).map(b => ({
              id: b.id,
              invoiceNumber: b.invoice_number,
              customer: b.customer_name,
              date: new Date(b.invoice_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
              amount: `₹ ${parseFloat(b.total_amount).toLocaleString('en-IN')}`,
              status: b.payment_status
            }))
          )
        }

        if (matData.success && matData.materials) {
          setDashboardStats(prev => ({
            ...prev,
            activeMaterials: matData.materials.filter(m => m.status === 'Active').length
          }))
        }
      } catch (err) {
        console.error('Error fetching dashboard summary:', err)
      }
    }

    fetchDashboardData()
  }, [])

  const handleOpenBillModal = async (billId) => {
    try {
      setIsLoadingPreview(true)
      const res = await fetch(API_ENDPOINTS.BILL_BY_ID(billId))
      const data = await res.json()
      if (data.success && data.bill) {
        setSelectedBillForPreview(data.bill)
      }
    } catch (err) {
      console.error('Error opening bill modal:', err)
    } finally {
      setIsLoadingPreview(false)
    }
  }


  // Dynamic stats array
  const stats = [
    {
      title: 'TOTAL REVENUE',
      value: `₹ ${dashboardStats.totalRevenue.toLocaleString('en-IN')}`,
      change: '+18.4%',
      isPositive: true,
      icon: TrendingUp,
      color: 'from-[#043486] to-[#0248BC]'
    },
    {
      title: 'TOTAL BILLS',
      value: String(dashboardStats.totalBills),
      change: '+1 new',
      isPositive: true,
      icon: Receipt,
      color: 'from-blue-600 to-cyan-600'
    },
    {
      title: 'ACTIVE MATERIALS',
      value: String(dashboardStats.activeMaterials),
      change: 'In stock',
      isPositive: true,
      icon: Boxes,
      color: 'from-emerald-600 to-teal-600'
    },
    {
      title: 'PENDING INVOICES',
      value: String(dashboardStats.pendingInvoices),
      change: 'To collect',
      isPositive: dashboardStats.pendingInvoices === 0,
      icon: Clock,
      color: 'from-amber-500 to-orange-600'
    }
  ]

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Velzon Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
        <div>
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-[#292424] dark:text-white uppercase">
            DASHBOARD
          </h1>
        </div>
        <div className="flex items-center text-xs text-gray-500 dark:text-slate-400 gap-1.5 font-medium">
          <span>Home</span>
          <span>›</span>
          <span className="text-[#043486] dark:text-blue-400 font-semibold">Dashboard</span>
        </div>
      </div>

      {/* Top 4 Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">

            {stats.map((stat, index) => {
              const Icon = stat.icon
              const targetRoute = index === 2 ? 'all-materials' : 'all-bills'
              return (
                <div
                  key={index}
                  onClick={() => setActiveRoute(targetRoute)}
                  className="bg-white dark:bg-slate-900 rounded-sm p-5 border border-gray-200/80 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-[#043486]/40 dark:hover:border-blue-500/40 transition-all duration-200 flex flex-col justify-between cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-gray-400 dark:text-slate-400 tracking-wider group-hover:text-[#043486] dark:group-hover:text-blue-400 transition-colors">
                      {stat.title}
                    </span>
                    <div className={`w-10 h-10 rounded-sm bg-gradient-to-tr ${stat.color} text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform`}>
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
                    onClick={() => setActiveRoute('all-materials')}
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
                <p className="text-xs font-semibold flex items-center gap-1.5">
                  <Sparkles size={13} className="text-amber-300" />
                  Simcha Cloud Sync
                </p>
                <p className="text-[11px] text-blue-100 mt-0.5">TiDB Serverless Connection: Ready &amp; Active</p>
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
                      {recentBills.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-6 text-gray-400">
                            No recent bills found. Create your first invoice!
                          </td>
                        </tr>
                      ) : (
                        recentBills.map((bill) => (
                          <tr key={bill.id || bill.invoiceNumber} className="hover:bg-gray-50/80 dark:hover:bg-slate-800/60 transition-colors">
                            <td className="py-3.5 px-2 font-semibold text-[#043486] dark:text-blue-400">
                              {bill.invoiceNumber}
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
                                <button
                                  onClick={() => handleOpenBillModal(bill.id)}
                                  className="p-1 hover:text-[#043486] dark:hover:text-blue-400 transition-colors cursor-pointer"
                                  title="View Invoice Preview & Print"
                                >
                                  <Eye size={15} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

          </div>

      {/* Invoice Modal Preview */}
      {selectedBillForPreview && (
        <InvoiceModal
          bill={selectedBillForPreview}
          settings={settings}
          onClose={() => setSelectedBillForPreview(null)}
        />
      )}

    </div>
  )
}

