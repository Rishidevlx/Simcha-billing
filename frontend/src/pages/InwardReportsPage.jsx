import { useState, useEffect, useMemo } from 'react'
import {
  FileText,
  Search,
  Plus,
  Eye,
  Trash2,
  Calendar,
  IndianRupee,
  Boxes,
  Phone,
  Building2,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Download,
  RotateCcw,
  X,
  PackageCheck,
  Hash,
  ShieldCheck,
  Clock
} from 'lucide-react'
import * as XLSX from 'xlsx'
import Swal from 'sweetalert2'
import { API_ENDPOINTS } from '../config/api'

export default function InwardReportsPage({ setActiveRoute }) {
  const [inwards, setInwards] = useState([])
  const [stats, setStats] = useState({ totalInwards: 0, totalAmount: 0, totalItems: 0 })
  const [isLoading, setIsLoading] = useState(true)

  // Filters State
  const [searchTerm, setSearchTerm] = useState('')
  const [datePreset, setDatePreset] = useState('ALL')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  // Selected Inward for Details Modal
  const [selectedInward, setSelectedInward] = useState(null)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)

  const fetchInwardData = async () => {
    try {
      setIsLoading(true)
      const res = await fetch(API_ENDPOINTS.INWARDS)
      const data = await res.json()
      if (data.success) {
        setInwards(data.inwards || [])
        if (data.stats) {
          setStats(data.stats)
        }
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: data.message || 'Failed to load inward reports.',
          confirmButtonColor: '#043486'
        })
      }
    } catch (err) {
      console.error('Error fetching inward reports:', err)
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to retrieve inward records from database.',
        confirmButtonColor: '#043486'
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchInwardData()
  }, [])

  // Handle Date Filter Presets
  const handleDatePresetChange = (preset) => {
    setDatePreset(preset)
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]

    if (preset === 'ALL') {
      setStartDate('')
      setEndDate('')
    } else if (preset === 'TODAY') {
      setStartDate(todayStr)
      setEndDate(todayStr)
    } else if (preset === 'THIS_MONTH') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]
      setStartDate(firstDay)
      setEndDate(todayStr)
    }
    setCurrentPage(1)
  }

  const handleResetFilters = () => {
    setSearchTerm('')
    setDatePreset('ALL')
    setStartDate('')
    setEndDate('')
    setCurrentPage(1)
  }

  // Filtered and Searched Inwards
  const filteredInwards = useMemo(() => {
    return inwards.filter((item) => {
      // 1. Search Query
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim()
        const inwardNo = (item.inward_number || '').toLowerCase()
        const supplierName = (item.supplier_name || '').toLowerCase()
        const phone = (item.supplier_phone || '').toLowerCase()
        const gstin = (item.supplier_gstin || '').toLowerCase()
        
        const matchSearch =
          inwardNo.includes(query) ||
          supplierName.includes(query) ||
          phone.includes(query) ||
          gstin.includes(query)

        if (!matchSearch) return false
      }

      // 2. Date Range
      if (startDate || endDate) {
        const itemDate = new Date(item.inward_date).toISOString().split('T')[0]
        if (startDate && itemDate < startDate) return false
        if (endDate && itemDate > endDate) return false
      }

      return true
    })
  }, [inwards, searchTerm, startDate, endDate])

  // Pagination Calculations
  const totalPages = Math.ceil(filteredInwards.length / itemsPerPage) || 1
  const paginatedInwards = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredInwards.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredInwards, currentPage, itemsPerPage])

  // View Details Modal Trigger
  const handleOpenDetails = async (inwardId) => {
    try {
      setIsLoadingDetails(true)
      const res = await fetch(API_ENDPOINTS.INWARD_BY_ID(inwardId))
      const data = await res.json()
      if (data.success && data.inward) {
        setSelectedInward(data.inward)
      } else {
        // Fallback to local list
        const local = inwards.find(i => i.id === inwardId)
        if (local) setSelectedInward(local)
      }
    } catch (err) {
      console.error('Error opening inward details:', err)
    } finally {
      setIsLoadingDetails(false)
    }
  }

  // Delete Inward Record
  const handleDeleteInward = async (id, inwardNumber, supplierName) => {
    const result = await Swal.fire({
      title: 'Delete Inward Record?',
      html: `Are you sure you want to delete Inward entry <b>${inwardNumber}</b> from <b>${supplierName}</b>?<br/><span class="text-xs text-red-500">This action cannot be undone.</span>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#4b5563',
      confirmButtonText: 'Yes, Delete It',
      cancelButtonText: 'Cancel'
    })

    if (result.isConfirmed) {
      try {
        const res = await fetch(API_ENDPOINTS.INWARD_BY_ID(id), {
          method: 'DELETE'
        })
        const data = await res.json()
        if (data.success) {
          Swal.fire({
            icon: 'success',
            title: 'Deleted!',
            text: data.message || 'Inward record deleted successfully.',
            timer: 1800,
            showConfirmButton: false
          })
          fetchInwardData()
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: data.message || 'Failed to delete inward record.',
            confirmButtonColor: '#043486'
          })
        }
      } catch (err) {
        console.error('Error deleting inward:', err)
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Server communication error while deleting.',
          confirmButtonColor: '#043486'
        })
      }
    }
  }

  // Export to Excel
  const handleExportExcel = () => {
    if (filteredInwards.length === 0) {
      Swal.fire({
        icon: 'info',
        title: 'No Data',
        text: 'There are no inward records to export for the current filters.',
        confirmButtonColor: '#043486'
      })
      return
    }

    const exportData = filteredInwards.map((inv, idx) => ({
      'S.No': idx + 1,
      'Inward No': inv.inward_number,
      'Inward Date': new Date(inv.inward_date).toLocaleDateString('en-GB'),
      'Supplier Name': inv.supplier_name,
      'Phone Number': inv.supplier_phone || '-',
      'Email': inv.supplier_email || '-',
      'Location / State': inv.supplier_location || '-',
      'GSTIN': inv.supplier_gstin || '-',
      'Total Items / Qty': inv.total_quantity || inv.total_items || (inv.items ? inv.items.length : 0),
      'Taxable Amount (₹)': parseFloat(inv.taxable_amount || 0).toFixed(2),
      'Total Tax (₹)': parseFloat(inv.total_tax || 0).toFixed(2),
      'Total Amount (₹)': parseFloat(inv.total_amount || 0).toFixed(2)
    }))

    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Inward_Reports')
    XLSX.writeFile(wb, `Inward_Reports_${new Date().toISOString().split('T')[0]}.xlsx`)

    Swal.fire({
      icon: 'success',
      title: 'Excel Exported',
      text: `Successfully exported ${exportData.length} inward records.`,
      timer: 1800,
      showConfirmButton: false
    })
  }

  return (
    <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 space-y-6 pb-16 font-['Poppins',sans-serif]">
      
      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-none border border-gray-200 dark:border-slate-800 shadow-sm transition-colors">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-[#043486] dark:text-blue-400 rounded-none border border-blue-100 dark:border-blue-800/50">
              <FileText size={22} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#292424] dark:text-white">Inward Reports</h1>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                Comprehensive log of all inward inventory purchases, supplier details, and material records.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-none shadow-xs transition-colors cursor-pointer"
          >
            <Download size={15} />
            Export Excel
          </button>
          <button
            onClick={() => setActiveRoute('inward')}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#043486] hover:bg-[#02225a] text-white text-xs font-semibold rounded-none shadow-xs transition-colors cursor-pointer"
          >
            <Plus size={15} />
            Create Inward
          </button>
        </div>
      </div>

      {/* 2. Top Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-none border border-gray-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Total Inward Entries</p>
            <p className="text-2xl font-bold text-[#292424] dark:text-white mt-1.5">{stats.totalInwards || inwards.length}</p>
            <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">Recorded supplier bills</span>
          </div>
          <div className="w-12 h-12 rounded-none bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-[#043486] dark:text-blue-400 border border-blue-100 dark:border-blue-800/40">
            <FileText size={24} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-none border border-gray-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Total Inward Amount</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1.5">
              ₹ {parseFloat(stats.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <span className="text-[11px] text-gray-500 dark:text-slate-400">Cumulative purchase value</span>
          </div>
          <div className="w-12 h-12 rounded-none bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/40">
            <IndianRupee size={24} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-none border border-gray-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Total Materials Received</p>
            <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1.5">
              {stats.totalItems || 0} Units
            </p>
            <span className="text-[11px] text-indigo-500 dark:text-indigo-400">Added to shop stock</span>
          </div>
          <div className="w-12 h-12 rounded-none bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/40">
            <Boxes size={24} />
          </div>
        </div>
      </div>

      {/* 3. Filters & Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-none border border-gray-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1)
              }}
              placeholder="Search by supplier, phone, inward #..."
              className="w-full pl-10 pr-4 py-2 text-xs border border-gray-300 dark:border-slate-700 rounded-none bg-white dark:bg-slate-900 text-[#292424] dark:text-white placeholder-gray-400 focus:outline-none focus:border-[#043486] transition-colors"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Quick Date Presets & Custom Range */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-none border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 p-0.5">
              <button
                onClick={() => handleDatePresetChange('ALL')}
                className={`px-3 py-1.5 text-xs font-medium rounded-none transition-colors cursor-pointer ${
                  datePreset === 'ALL'
                    ? 'bg-[#043486] text-white shadow-xs'
                    : 'text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                All Time
              </button>
              <button
                onClick={() => handleDatePresetChange('TODAY')}
                className={`px-3 py-1.5 text-xs font-medium rounded-none transition-colors cursor-pointer ${
                  datePreset === 'TODAY'
                    ? 'bg-[#043486] text-white shadow-xs'
                    : 'text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => handleDatePresetChange('THIS_MONTH')}
                className={`px-3 py-1.5 text-xs font-medium rounded-none transition-colors cursor-pointer ${
                  datePreset === 'THIS_MONTH'
                    ? 'bg-[#043486] text-white shadow-xs'
                    : 'text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                This Month
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value)
                  setDatePreset('CUSTOM')
                  setCurrentPage(1)
                }}
                className="px-2.5 py-1.5 text-xs border border-gray-300 dark:border-slate-700 rounded-none bg-white dark:bg-slate-900 text-[#292424] dark:text-white focus:outline-none focus:border-[#043486]"
                title="Start Date"
              />
              <span className="text-gray-400 text-xs">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value)
                  setDatePreset('CUSTOM')
                  setCurrentPage(1)
                }}
                className="px-2.5 py-1.5 text-xs border border-gray-300 dark:border-slate-700 rounded-none bg-white dark:bg-slate-900 text-[#292424] dark:text-white focus:outline-none focus:border-[#043486]"
                title="End Date"
              />
            </div>

            {(searchTerm || datePreset !== 'ALL' || startDate || endDate) && (
              <button
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 border border-red-200 dark:border-red-900/40 rounded-none transition-colors cursor-pointer"
                title="Reset Filters"
              >
                <RotateCcw size={13} />
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4. Inward Reports Table (Clean, Boxy, Specific Columns) */}
      <div className="bg-white dark:bg-slate-900 rounded-none border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#405189] dark:bg-slate-800 text-white font-semibold uppercase tracking-wider text-[11px] border-b border-gray-200 dark:border-slate-700">
                <th className="py-3.5 px-4 w-12 text-center">S.No</th>
                <th className="py-3.5 px-4">Inward Date</th>
                <th className="py-3.5 px-4">Inward No</th>
                <th className="py-3.5 px-4">Supplier Name</th>
                <th className="py-3.5 px-4">Phone Number</th>
                <th className="py-3.5 px-4 text-center">Total Items</th>
                <th className="py-3.5 px-4 text-right">Total Amt</th>
                <th className="py-3.5 px-4 text-center w-28">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800 text-gray-700 dark:text-slate-300">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-[#043486] border-t-transparent rounded-full animate-spin" />
                      <span>Loading inward records...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedInwards.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <PackageCheck size={36} className="text-gray-300 dark:text-slate-600" />
                      <p className="font-semibold text-gray-600 dark:text-slate-400 text-sm">No Inward Reports Found</p>
                      <p className="text-xs text-gray-400">Try adjusting your filters or record a new Inward bill.</p>
                      <button
                        onClick={() => setActiveRoute('inward')}
                        className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#043486] hover:bg-[#02225a] text-white text-xs font-medium rounded-none shadow-xs"
                      >
                        <Plus size={14} />
                        Create New Inward
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedInwards.map((inv, idx) => {
                  const serialIndex = (currentPage - 1) * itemsPerPage + idx + 1
                  const formattedDate = new Date(inv.inward_date).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  })
                  const totalItemsCount = inv.total_quantity || inv.total_items || (inv.items ? inv.items.length : 0)
                  const totalAmountFormatted = `₹ ${parseFloat(inv.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

                  return (
                    <tr
                      key={inv.id}
                      className="hover:bg-blue-50/50 dark:hover:bg-slate-800/60 transition-colors group"
                    >
                      {/* 1. S.No */}
                      <td className="py-3.5 px-4 text-center font-medium text-gray-500 dark:text-slate-400">
                        {serialIndex}
                      </td>

                      {/* 2. Inward Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-gray-400 dark:text-slate-500" />
                          <span className="font-medium text-gray-800 dark:text-slate-200">{formattedDate}</span>
                        </div>
                      </td>

                      {/* 3. Inward No */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-bold text-[#043486] dark:text-blue-400 tracking-wide bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 border border-blue-200 dark:border-blue-800/50">
                          {inv.inward_number}
                        </span>
                      </td>

                      {/* 4. Supplier Name */}
                      <td className="py-3.5 px-4">
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white group-hover:text-[#043486] dark:group-hover:text-blue-400 transition-colors">
                            {inv.supplier_name}
                          </p>
                          {inv.supplier_location && (
                            <p className="text-[11px] text-gray-400 dark:text-slate-500 truncate max-w-xs">
                              {inv.supplier_location}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* 5. Phone Number */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {inv.supplier_phone ? (
                          <div className="flex items-center gap-1.5 text-gray-700 dark:text-slate-300">
                            <Phone size={13} className="text-gray-400" />
                            <span>{inv.supplier_phone}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">-</span>
                        )}
                      </td>

                      {/* 6. Total Items */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-bold rounded-none border border-indigo-100 dark:border-indigo-800/40">
                          <Boxes size={12} />
                          {totalItemsCount}
                        </span>
                      </td>

                      {/* 7. Total Amt */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <span className="font-bold text-emerald-700 dark:text-emerald-400 text-sm">
                          {totalAmountFormatted}
                        </span>
                      </td>

                      {/* 8. Actions */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenDetails(inv.id)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 rounded-none border border-blue-200 dark:border-blue-900/50 transition-colors cursor-pointer"
                            title="View Inward Details"
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            onClick={() => handleDeleteInward(inv.id, inv.inward_number, inv.supplier_name)}
                            className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-slate-700 rounded-none border border-red-200 dark:border-red-900/50 transition-colors cursor-pointer"
                            title="Delete Inward"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 5. Pagination Footer */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-slate-800/50 border-t border-gray-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="text-gray-500 dark:text-slate-400">
            Showing <span className="font-semibold text-gray-800 dark:text-slate-200">{filteredInwards.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}</span> to{' '}
            <span className="font-semibold text-gray-800 dark:text-slate-200">{Math.min(currentPage * itemsPerPage, filteredInwards.length)}</span> of{' '}
            <span className="font-semibold text-gray-800 dark:text-slate-200">{filteredInwards.length}</span> inward entries
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-300 font-medium rounded-none disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft size={14} />
              Previous
            </button>

            <span className="px-3 py-1.5 bg-[#043486] text-white font-bold rounded-none">
              {currentPage} / {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="px-3 py-1.5 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-300 font-medium rounded-none disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1 cursor-pointer"
            >
              Next
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* 6. Inward Details Modal */}
      {selectedInward && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col font-['Poppins',sans-serif]">
            
            {/* Modal Header */}
            <div className="px-6 py-4 bg-[#405189] dark:bg-slate-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-none">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-base">Inward Entry Details</h3>
                  <p className="text-xs text-blue-100 opacity-90">Inward No: #{selectedInward.inward_number}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedInward(null)}
                className="p-1.5 hover:bg-white/10 text-white transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              
              {/* Supplier & Entry Information Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-800 space-y-2">
                  <p className="text-[11px] font-bold text-gray-400 dark:text-slate-400 uppercase tracking-wider">Supplier Information</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{selectedInward.supplier_name}</p>
                  <div className="text-xs text-gray-600 dark:text-slate-300 space-y-1">
                    <p><span className="font-medium text-gray-500 dark:text-slate-400">Phone:</span> {selectedInward.supplier_phone || '-'}</p>
                    <p><span className="font-medium text-gray-500 dark:text-slate-400">Email:</span> {selectedInward.supplier_email || '-'}</p>
                    <p><span className="font-medium text-gray-500 dark:text-slate-400">Location:</span> {selectedInward.supplier_location || '-'}</p>
                    <p><span className="font-medium text-gray-500 dark:text-slate-400">GSTIN:</span> {selectedInward.supplier_gstin || 'Unregistered'}</p>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-800 space-y-2">
                  <p className="text-[11px] font-bold text-gray-400 dark:text-slate-400 uppercase tracking-wider">Inward Summary</p>
                  <div className="text-xs text-gray-600 dark:text-slate-300 space-y-1.5">
                    <p className="flex justify-between">
                      <span className="font-medium text-gray-500 dark:text-slate-400">Inward Date:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {new Date(selectedInward.inward_date).toLocaleDateString('en-GB')}
                      </span>
                    </p>
                    <p className="flex justify-between">
                      <span className="font-medium text-gray-500 dark:text-slate-400">Total Quantity:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {selectedInward.total_quantity || selectedInward.total_items} Units
                      </span>
                    </p>
                    <p className="flex justify-between">
                      <span className="font-medium text-gray-500 dark:text-slate-400">Taxable Amount:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        ₹ {parseFloat(selectedInward.taxable_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </p>
                    <p className="flex justify-between">
                      <span className="font-medium text-gray-500 dark:text-slate-400">Total Tax:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        ₹ {parseFloat(selectedInward.total_tax || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </p>
                    <div className="pt-1.5 border-t border-gray-200 dark:border-slate-700 flex justify-between text-sm">
                      <span className="font-bold text-gray-900 dark:text-white">Grand Total:</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        ₹ {parseFloat(selectedInward.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Line Items Table */}
              <div>
                <h4 className="text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-2.5">
                  Materials Received ({(selectedInward.items || []).length})
                </h4>
                <div className="overflow-x-auto border border-gray-200 dark:border-slate-800">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 font-semibold text-[11px]">
                        <th className="py-2.5 px-3 w-10 text-center">#</th>
                        <th className="py-2.5 px-3">Item / Description</th>
                        <th className="py-2.5 px-3">HSN</th>
                        <th className="py-2.5 px-3 text-center">Qty</th>
                        <th className="py-2.5 px-3 text-right">Rate (₹)</th>
                        <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-800 text-gray-700 dark:text-slate-300">
                      {(selectedInward.items || []).map((it, idx) => (
                        <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                          <td className="py-3 px-3 text-center font-medium text-gray-400">{idx + 1}</td>
                          <td className="py-3 px-3">
                            <p className="font-bold text-gray-900 dark:text-white">{it.item_name}</p>
                            {it.description && <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5">{it.description}</p>}
                            
                            {/* Serial numbers badge list */}
                            {it.has_serial && it.serial_numbers_list && it.serial_numbers_list.length > 0 && (
                              <div className="mt-2 pt-1.5 border-t border-gray-100 dark:border-slate-800">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Serials: </span>
                                <div className="inline-flex flex-wrap gap-1 mt-1">
                                  {it.serial_numbers_list.map((sn, sIdx) => (
                                    <span
                                      key={sIdx}
                                      className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-[#043486] dark:text-blue-300 border border-blue-200 dark:border-blue-800/40 text-[10.5px] font-mono font-medium"
                                    >
                                      {sn}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-3 text-gray-600 dark:text-slate-400">{it.hsn_code || '-'}</td>
                          <td className="py-3 px-3 text-center font-semibold">{it.quantity} {it.unit || 'NOS'}</td>
                          <td className="py-3 px-3 text-right font-medium">₹ {parseFloat(it.rate || 0).toFixed(2)}</td>
                          <td className="py-3 px-3 text-right font-bold text-gray-900 dark:text-white">
                            ₹ {parseFloat(it.amount || 0).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 bg-gray-50 dark:bg-slate-800/60 border-t border-gray-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedInward(null)}
                className="px-5 py-2 bg-gray-800 hover:bg-gray-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white text-xs font-semibold rounded-none cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}
