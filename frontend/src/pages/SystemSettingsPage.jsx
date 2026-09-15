import { useState, useEffect } from 'react'
import {
  Building2,
  Percent,
  Landmark,
  FileText,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  CheckCircle2,
  Hash,
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  CreditCard,
  Info,
  Edit2,
  X,
  Lock
} from 'lucide-react'
import Swal from 'sweetalert2'
import { API_ENDPOINTS } from '../config/api'

export default function SystemSettingsPage() {
  const [activeTab, setActiveTab] = useState('company') // 'company' | 'taxes' | 'bank' | 'terms'
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Edit mode per tab
  const [editStates, setEditStates] = useState({
    company: false,
    taxes: false,
    bank: false,
    terms: false
  })

  // Company Details
  const [companyName, setCompanyName] = useState('SIMCHA INFO SOLUTIONS')
  const [address, setAddress] = useState('7A3, Thulasi Ammal Layout 2nd Street, Lakshmipuram, Peelamedu Post, Coimbatore - 641 004.')
  const [phone, setPhone] = useState('8122022060')
  const [email, setEmail] = useState('simchainfosolutions@gmail.com')
  const [gstin, setGstin] = useState('33GEZPM1178G1ZY')
  const [invoicePrefix, setInvoicePrefix] = useState('INV-')

  // Tax Rates
  const [cgstRate, setCgstRate] = useState('9.00')
  const [sgstRate, setSgstRate] = useState('9.00')
  const [igstRate, setIgstRate] = useState('18.00')

  // Bank Details
  const [bankName, setBankName] = useState('Canara Bank')
  const [accountName, setAccountName] = useState('Simcha Info Solutions')
  const [accountNo, setAccountNo] = useState('120041754011')
  const [ifscCode, setIfscCode] = useState('CNRB0002732')
  const [branch, setBranch] = useState('Peelamedu')

  // Terms & Conditions
  const [terms, setTerms] = useState([
    'Warranty as per manufacturer’s norms & should be claimed directly.',
    'Warranty claim takes 1 to 8 weeks.',
    'Please carry invoice copy for warranty.',
    'Goods Once Sold will not be taken back or exchanged.'
  ])
  const [newTermInput, setNewTermInput] = useState('')

  // Original snapshot for reset
  const [savedSettings, setSavedSettings] = useState(null)

  const fetchSettings = async () => {
    try {
      setIsLoading(true)
      const res = await fetch(API_ENDPOINTS.SETTINGS)
      const data = await res.json()
      if (data.success && data.settings) {
        const s = data.settings
        setSavedSettings(s)
        populateFields(s)
      }
    } catch (err) {
      console.error('Failed to load settings:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const populateFields = (s) => {
    if (!s) return
    setCompanyName(s.company_name || 'SIMCHA INFO SOLUTIONS')
    setAddress(s.address || '')
    setPhone(s.phone || '')
    setEmail(s.email || '')
    setGstin(s.gstin || '')
    setInvoicePrefix(s.invoice_prefix || 'INV-')

    setCgstRate(s.cgst_rate !== undefined ? String(s.cgst_rate) : '9.00')
    setSgstRate(s.sgst_rate !== undefined ? String(s.sgst_rate) : '9.00')
    setIgstRate(s.igst_rate !== undefined ? String(s.igst_rate) : '18.00')

    setBankName(s.bank_name || 'Canara Bank')
    setAccountName(s.account_name || 'Simcha Info Solutions')
    setAccountNo(s.account_no || '')
    setIfscCode(s.ifsc_code || '')
    setBranch(s.branch || '')

    if (Array.isArray(s.terms_conditions)) {
      setTerms(s.terms_conditions)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  const toggleEditTab = (tabId, state) => {
    setEditStates(prev => ({
      ...prev,
      [tabId]: state !== undefined ? state : !prev[tabId]
    }))
  }

  const handleCancelTab = (tabId) => {
    if (savedSettings) {
      populateFields(savedSettings)
    }
    toggleEditTab(tabId, false)
  }

  const handleAddTerm = () => {
    if (!newTermInput.trim()) return
    setTerms(prev => [...prev, newTermInput.trim()])
    setNewTermInput('')
  }

  const handleRemoveTerm = (index) => {
    setTerms(prev => prev.filter((_, i) => i !== index))
  }

  const handleTermChange = (index, val) => {
    setTerms(prev => {
      const updated = [...prev]
      updated[index] = val
      return updated
    })
  }

  const handleSubmit = async (e, tabId = activeTab) => {
    if (e && e.preventDefault) e.preventDefault()
    setIsSaving(true)

    try {
      const payload = {
        company_name: companyName.trim(),
        address: address.trim(),
        phone: phone.trim(),
        email: email.trim(),
        gstin: gstin.trim(),
        invoice_prefix: invoicePrefix.trim(),
        cgst_rate: parseFloat(cgstRate) || 9.00,
        sgst_rate: parseFloat(sgstRate) || 9.00,
        igst_rate: parseFloat(igstRate) || 18.00,
        bank_name: bankName.trim(),
        account_name: accountName.trim(),
        account_no: accountNo.trim(),
        ifsc_code: ifscCode.trim(),
        branch: branch.trim(),
        terms_conditions: terms.filter(t => t.trim())
      }

      const res = await fetch(API_ENDPOINTS.SETTINGS, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      if (data.success) {
        setSavedSettings(payload)
        toggleEditTab(tabId, false)

        Swal.fire({
          icon: 'success',
          title: 'Settings Saved',
          text: 'Settings updated successfully!',
          confirmButtonColor: '#043486',
          timer: 2000,
          showConfirmButton: false
        })
      } else {
        throw new Error(data.message || 'Failed to update settings')
      }
    } catch (err) {
      console.error('Error updating settings:', err)
      Swal.fire({
        icon: 'error',
        title: 'Save Failed',
        text: err.message || 'Unable to update settings.',
        confirmButtonColor: '#043486'
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-[500px] flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-[#043486] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const isCurrentTabEditing = editStates[activeTab]

  const tabs = [
    { id: 'company', label: 'Company Profile', icon: Building2, desc: 'Header details & contact info' },
    { id: 'taxes', label: 'Tax & GST Rates', icon: Percent, desc: 'CGST, SGST & IGST calculation' },
    { id: 'bank', label: 'Bank Account', icon: Landmark, desc: 'Invoice payment beneficiary' },
    { id: 'terms', label: 'Terms & Conditions', icon: FileText, desc: 'Printed invoice legal clauses', badge: terms.length }
  ]

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 font-['Poppins',sans-serif]">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-none border border-gray-200 dark:border-slate-800 shadow-sm transition-colors">
        <div>
          <h1 className="text-xl font-bold text-[#292424] dark:text-white">System &amp; Company Settings</h1>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">Configure Company profile, Tax rates, Bank accounts and Terms &amp; Conditions.</p>
        </div>
      </div>

      {/* Tab Navigation Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 bg-gray-100 dark:bg-slate-950 p-1.5 border border-gray-200 dark:border-slate-800">
        {tabs.map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          const isTabEditing = editStates[tab.id]
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 p-3 text-left transition-all cursor-pointer rounded-none relative ${
                isActive
                  ? 'bg-[#043486] text-white shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 border border-transparent'
              }`}
            >
              <div className={`p-2 rounded-none ${isActive ? 'bg-white/15 text-white' : 'bg-gray-100 dark:bg-slate-800 text-[#043486] dark:text-blue-400'}`}>
                <Icon size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold truncate">{tab.label}</span>
                  {isTabEditing ? (
                    <span className="text-[9px] font-bold px-1.5 py-0.2 bg-amber-400 text-slate-900 rounded-none animate-pulse">
                      EDITING
                    </span>
                  ) : tab.badge !== undefined ? (
                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-none ${isActive ? 'bg-white text-[#043486]' : 'bg-blue-100 dark:bg-blue-950 text-[#043486] dark:text-blue-300'}`}>
                      {tab.badge}
                    </span>
                  ) : null}
                </div>
                <p className={`text-[10px] truncate ${isActive ? 'text-blue-100' : 'text-gray-400 dark:text-slate-500'}`}>
                  {tab.desc}
                </p>
              </div>
            </button>
          )
        })}
      </div>

      <form onSubmit={(e) => handleSubmit(e, activeTab)} className="space-y-6">
        
        {/* ================= TAB 1: COMPANY PROFILE ================= */}
        {activeTab === 'company' && (
          <div className="bg-white dark:bg-slate-900 rounded-none border border-gray-200 dark:border-slate-800 p-6 shadow-sm space-y-6 transition-colors">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <Building2 size={18} className="text-[#043486] dark:text-blue-400" />
                <h2 className="text-base font-bold text-[#292424] dark:text-white">Company Profile &amp; Billing Header</h2>
              </div>
              
              {/* Tab Header Edit Button */}
              {!editStates.company ? (
                <button
                  type="button"
                  onClick={() => toggleEditTab('company', true)}
                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-[#043486] hover:bg-[#0248BC] rounded-none transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Edit2 size={13} />
                  <span>Edit Profile</span>
                </button>
              ) : (
                <span className="text-xs px-2.5 py-1 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800 font-bold">
                  Editing Mode Active
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1.5">Company / Business Name *</label>
                <input
                  type="text"
                  disabled={!editStates.company}
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                  className={`w-full px-3.5 py-2.5 text-sm font-medium rounded-none transition-all ${
                    editStates.company
                      ? 'text-[#292424] dark:text-white bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 focus:outline-none focus:border-[#043486] dark:focus:border-blue-500 ring-1 ring-[#043486]/10'
                      : 'text-gray-600 dark:text-slate-400 bg-gray-50 dark:bg-slate-950/60 border border-gray-200 dark:border-slate-800 cursor-not-allowed select-none'
                  }`}
                  placeholder="Enter company name"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1.5">Company GSTIN Number *</label>
                <input
                  type="text"
                  disabled={!editStates.company}
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value.toUpperCase())}
                  required
                  className={`w-full px-3.5 py-2.5 text-sm uppercase rounded-none font-mono font-semibold transition-all ${
                    editStates.company
                      ? 'text-[#292424] dark:text-white bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 focus:outline-none focus:border-[#043486] dark:focus:border-blue-500 ring-1 ring-[#043486]/10'
                      : 'text-gray-600 dark:text-slate-400 bg-gray-50 dark:bg-slate-950/60 border border-gray-200 dark:border-slate-800 cursor-not-allowed select-none'
                  }`}
                  placeholder="Enter GSTIN number"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1.5">Invoice Number Prefix</label>
                <input
                  type="text"
                  disabled={!editStates.company}
                  value={invoicePrefix}
                  onChange={(e) => setInvoicePrefix(e.target.value.toUpperCase())}
                  className={`w-full px-3.5 py-2.5 text-sm uppercase rounded-none font-mono font-bold transition-all ${
                    editStates.company
                      ? 'text-[#043486] dark:text-blue-400 bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 focus:outline-none focus:border-[#043486] dark:focus:border-blue-500 ring-1 ring-[#043486]/10'
                      : 'text-[#043486]/70 dark:text-blue-400/70 bg-gray-50 dark:bg-slate-950/60 border border-gray-200 dark:border-slate-800 cursor-not-allowed select-none'
                  }`}
                  placeholder="e.g. INV-"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1.5">Official Phone / Mobile Number *</label>
                <input
                  type="text"
                  disabled={!editStates.company}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className={`w-full px-3.5 py-2.5 text-sm font-medium font-mono rounded-none transition-all ${
                    editStates.company
                      ? 'text-[#292424] dark:text-white bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 focus:outline-none focus:border-[#043486] dark:focus:border-blue-500 ring-1 ring-[#043486]/10'
                      : 'text-gray-600 dark:text-slate-400 bg-gray-50 dark:bg-slate-950/60 border border-gray-200 dark:border-slate-800 cursor-not-allowed select-none'
                  }`}
                  placeholder="Enter phone number"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1.5">Official Email Address *</label>
                <input
                  type="email"
                  disabled={!editStates.company}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className={`w-full px-3.5 py-2.5 text-sm font-medium rounded-none transition-all ${
                    editStates.company
                      ? 'text-[#292424] dark:text-white bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 focus:outline-none focus:border-[#043486] dark:focus:border-blue-500 ring-1 ring-[#043486]/10'
                      : 'text-gray-600 dark:text-slate-400 bg-gray-50 dark:bg-slate-950/60 border border-gray-200 dark:border-slate-800 cursor-not-allowed select-none'
                  }`}
                  placeholder="Enter official email"
                />
              </div>

              <div className="md:col-span-2 lg:col-span-3">
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1.5">Company Full Address *</label>
                <textarea
                  rows={2}
                  disabled={!editStates.company}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                  className={`w-full px-3.5 py-2.5 text-sm font-medium rounded-none transition-all ${
                    editStates.company
                      ? 'text-[#292424] dark:text-white bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 focus:outline-none focus:border-[#043486] dark:focus:border-blue-500 ring-1 ring-[#043486]/10'
                      : 'text-gray-600 dark:text-slate-400 bg-gray-50 dark:bg-slate-950/60 border border-gray-200 dark:border-slate-800 cursor-not-allowed select-none'
                  }`}
                  placeholder="Enter company address"
                />
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: TAX & GST RATES ================= */}
        {activeTab === 'taxes' && (
          <div className="bg-white dark:bg-slate-900 rounded-none border border-gray-200 dark:border-slate-800 p-6 shadow-sm space-y-6 transition-colors">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <Percent size={18} className="text-[#043486] dark:text-blue-400" />
                <h2 className="text-base font-bold text-[#292424] dark:text-white">Tax &amp; GST Rate Percentages</h2>
              </div>
              
              {/* Tab Header Edit Button */}
              {!editStates.taxes ? (
                <button
                  type="button"
                  onClick={() => toggleEditTab('taxes', true)}
                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-[#043486] hover:bg-[#0248BC] rounded-none transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Edit2 size={13} />
                  <span>Edit Tax Rates</span>
                </button>
              ) : (
                <span className="text-xs px-2.5 py-1 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800 font-bold">
                  Editing Mode Active
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="p-4 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#043486] dark:text-blue-400 uppercase">CGST (Central Tax)</span>
                  <span className="text-[10px] text-gray-500 dark:text-slate-400">Intra-State</span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    disabled={!editStates.taxes}
                    value={cgstRate}
                    onChange={(e) => setCgstRate(e.target.value)}
                    className={`w-full px-3.5 py-2.5 pr-8 text-base font-bold rounded-none transition-all ${
                      editStates.taxes
                        ? 'text-[#043486] dark:text-blue-300 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 focus:outline-none focus:border-[#043486] dark:focus:border-blue-500'
                        : 'text-gray-600 dark:text-slate-400 bg-gray-100 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-800 cursor-not-allowed select-none'
                    }`}
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 dark:text-slate-500">%</span>
                </div>
                <p className="text-[11px] text-gray-500 dark:text-slate-400">Applied when customer place of supply is within Tamil Nadu (33).</p>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#043486] dark:text-blue-400 uppercase">SGST (State Tax)</span>
                  <span className="text-[10px] text-gray-500 dark:text-slate-400">Intra-State</span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    disabled={!editStates.taxes}
                    value={sgstRate}
                    onChange={(e) => setSgstRate(e.target.value)}
                    className={`w-full px-3.5 py-2.5 pr-8 text-base font-bold rounded-none transition-all ${
                      editStates.taxes
                        ? 'text-[#043486] dark:text-blue-300 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 focus:outline-none focus:border-[#043486] dark:focus:border-blue-500'
                        : 'text-gray-600 dark:text-slate-400 bg-gray-100 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-800 cursor-not-allowed select-none'
                    }`}
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 dark:text-slate-500">%</span>
                </div>
                <p className="text-[11px] text-gray-500 dark:text-slate-400">Applied alongside CGST for within-state sales (Total {Number(cgstRate || 0) + Number(sgstRate || 0)}%).</p>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#043486] dark:text-blue-400 uppercase">IGST (Integrated Tax)</span>
                  <span className="text-[10px] text-gray-500 dark:text-slate-400">Inter-State</span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    disabled={!editStates.taxes}
                    value={igstRate}
                    onChange={(e) => setIgstRate(e.target.value)}
                    className={`w-full px-3.5 py-2.5 pr-8 text-base font-bold rounded-none transition-all ${
                      editStates.taxes
                        ? 'text-[#043486] dark:text-blue-300 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 focus:outline-none focus:border-[#043486] dark:focus:border-blue-500'
                        : 'text-gray-600 dark:text-slate-400 bg-gray-100 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-800 cursor-not-allowed select-none'
                    }`}
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 dark:text-slate-500">%</span>
                </div>
                <p className="text-[11px] text-gray-500 dark:text-slate-400">Applied automatically when customer is from outside Tamil Nadu (e.g. Kerala, Karnataka).</p>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 3: BANK ACCOUNT ================= */}
        {activeTab === 'bank' && (
          <div className="bg-white dark:bg-slate-900 rounded-none border border-gray-200 dark:border-slate-800 p-6 shadow-sm space-y-6 transition-colors">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <Landmark size={18} className="text-[#043486] dark:text-blue-400" />
                <h2 className="text-base font-bold text-[#292424] dark:text-white">Bank Account Information</h2>
              </div>
              
              {/* Tab Header Edit Button */}
              {!editStates.bank ? (
                <button
                  type="button"
                  onClick={() => toggleEditTab('bank', true)}
                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-[#043486] hover:bg-[#0248BC] rounded-none transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Edit2 size={13} />
                  <span>Edit Bank Details</span>
                </button>
              ) : (
                <span className="text-xs px-2.5 py-1 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800 font-bold">
                  Editing Mode Active
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1.5">Bank Name</label>
                <input
                  type="text"
                  disabled={!editStates.bank}
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className={`w-full px-3.5 py-2.5 text-sm font-medium rounded-none transition-all ${
                    editStates.bank
                      ? 'text-[#292424] dark:text-white bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 focus:outline-none focus:border-[#043486] dark:focus:border-blue-500'
                      : 'text-gray-600 dark:text-slate-400 bg-gray-50 dark:bg-slate-950/60 border border-gray-200 dark:border-slate-800 cursor-not-allowed select-none'
                  }`}
                  placeholder="e.g. Canara Bank"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1.5">Beneficiary / Account Name</label>
                <input
                  type="text"
                  disabled={!editStates.bank}
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  className={`w-full px-3.5 py-2.5 text-sm font-medium rounded-none transition-all ${
                    editStates.bank
                      ? 'text-[#292424] dark:text-white bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 focus:outline-none focus:border-[#043486] dark:focus:border-blue-500'
                      : 'text-gray-600 dark:text-slate-400 bg-gray-50 dark:bg-slate-950/60 border border-gray-200 dark:border-slate-800 cursor-not-allowed select-none'
                  }`}
                  placeholder="e.g. Simcha Info Solutions"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1.5">Account Number</label>
                <input
                  type="text"
                  disabled={!editStates.bank}
                  value={accountNo}
                  onChange={(e) => setAccountNo(e.target.value)}
                  className={`w-full px-3.5 py-2.5 text-sm font-semibold font-mono rounded-none transition-all ${
                    editStates.bank
                      ? 'text-[#292424] dark:text-white bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 focus:outline-none focus:border-[#043486] dark:focus:border-blue-500'
                      : 'text-gray-600 dark:text-slate-400 bg-gray-50 dark:bg-slate-950/60 border border-gray-200 dark:border-slate-800 cursor-not-allowed select-none'
                  }`}
                  placeholder="Enter account number"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1.5">IFSC Code</label>
                <input
                  type="text"
                  disabled={!editStates.bank}
                  value={ifscCode}
                  onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                  className={`w-full px-3.5 py-2.5 text-sm font-semibold uppercase font-mono rounded-none transition-all ${
                    editStates.bank
                      ? 'text-[#043486] dark:text-blue-400 bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 focus:outline-none focus:border-[#043486] dark:focus:border-blue-500'
                      : 'text-[#043486]/70 dark:text-blue-400/70 bg-gray-50 dark:bg-slate-950/60 border border-gray-200 dark:border-slate-800 cursor-not-allowed select-none'
                  }`}
                  placeholder="e.g. CNRB0002732"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1.5">Branch Location</label>
                <input
                  type="text"
                  disabled={!editStates.bank}
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className={`w-full px-3.5 py-2.5 text-sm font-medium rounded-none transition-all ${
                    editStates.bank
                      ? 'text-[#292424] dark:text-white bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 focus:outline-none focus:border-[#043486] dark:focus:border-blue-500'
                      : 'text-gray-600 dark:text-slate-400 bg-gray-50 dark:bg-slate-950/60 border border-gray-200 dark:border-slate-800 cursor-not-allowed select-none'
                  }`}
                  placeholder="e.g. Peelamedu"
                />
              </div>
            </div>

            {/* Live Invoice Preview Box */}
            <div className="p-4 bg-blue-50/60 dark:bg-slate-950 border border-blue-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#043486] dark:text-blue-300 uppercase">
                <Info size={14} />
                <span>Invoice Print Preview</span>
              </div>
              <div className="text-xs text-gray-700 dark:text-slate-300 font-mono bg-white dark:bg-slate-900 p-3 border border-blue-100 dark:border-slate-800 space-y-1">
                <p><strong>Bank:</strong> {bankName || 'Bank Name'} ({branch || 'Branch'})</p>
                <p><strong>Beneficiary:</strong> {accountName || 'Beneficiary Name'}</p>
                <p><strong>A/C:</strong> {accountNo || 'XXXXXXXXXXXX'} | <strong>IFSC:</strong> {ifscCode || 'IFSCXXXXXX'}</p>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 4: TERMS & CONDITIONS ================= */}
        {activeTab === 'terms' && (
          <div className="bg-white dark:bg-slate-900 rounded-none border border-gray-200 dark:border-slate-800 p-6 shadow-sm space-y-5 transition-colors">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <FileText size={18} className="text-[#043486] dark:text-blue-400" />
                <h2 className="text-base font-bold text-[#292424] dark:text-white">Terms &amp; Conditions Clauses</h2>
              </div>
              
              {/* Tab Header Edit Button */}
              {!editStates.terms ? (
                <button
                  type="button"
                  onClick={() => toggleEditTab('terms', true)}
                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-[#043486] hover:bg-[#0248BC] rounded-none transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Edit2 size={13} />
                  <span>Edit Terms</span>
                </button>
              ) : (
                <span className="text-xs px-2.5 py-1 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800 font-bold">
                  Editing Mode Active
                </span>
              )}
            </div>

            <div className="space-y-3">
              {terms.map((term, index) => (
                <div key={index} className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-none bg-gray-100 dark:bg-slate-800 text-[#043486] dark:text-blue-400 font-bold text-xs flex items-center justify-center shrink-0 border border-gray-200 dark:border-slate-700">
                    {index + 1}
                  </span>
                  <input
                    type="text"
                    disabled={!editStates.terms}
                    value={term}
                    onChange={(e) => handleTermChange(index, e.target.value)}
                    className={`flex-1 px-3.5 py-2 text-sm font-medium rounded-none transition-all ${
                      editStates.terms
                        ? 'text-[#292424] dark:text-white bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 focus:outline-none focus:border-[#043486] dark:focus:border-blue-500'
                        : 'text-gray-600 dark:text-slate-400 bg-gray-50 dark:bg-slate-950/60 border border-gray-200 dark:border-slate-800 cursor-not-allowed select-none'
                    }`}
                  />
                  {editStates.terms && (
                    <button
                      type="button"
                      onClick={() => handleRemoveTerm(index)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-none transition-colors cursor-pointer"
                      title="Remove clause"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Add new term input (Visible only when editing terms) */}
            {editStates.terms ? (
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="text"
                  value={newTermInput}
                  onChange={(e) => setNewTermInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddTerm()
                    }
                  }}
                  placeholder="Type new terms & condition clause and press Add..."
                  className="flex-1 px-3.5 py-2.5 text-sm text-[#292424] dark:text-white font-medium bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-none focus:outline-none focus:border-[#043486] dark:focus:border-blue-500 placeholder:text-gray-400 dark:placeholder:text-slate-500"
                />
                <button
                  type="button"
                  onClick={handleAddTerm}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900 text-[#043486] dark:text-blue-300 text-xs font-semibold rounded-none border border-blue-200 dark:border-blue-900 transition-colors shrink-0 cursor-pointer"
                >
                  <Plus size={16} />
                  <span>Add Clause</span>
                </button>
              </div>
            ) : (
              <p className="text-xs text-gray-400 dark:text-slate-500 pt-1 flex items-center gap-1.5">
                <Lock size={12} />
                <span>Click &quot;Edit Terms&quot; above to add or remove invoice clauses.</span>
              </p>
            )}
          </div>
        )}

        {/* Bottom Save Action - Only shown when current active tab is being edited */}
        {isCurrentTabEditing && (
          <div className="flex items-center justify-end gap-3 pt-2 animate-in fade-in duration-150">
            <button
              type="button"
              onClick={() => handleCancelTab(activeTab)}
              className="flex items-center gap-2 px-5 py-2.5 border border-gray-300 dark:border-slate-700 text-gray-600 dark:text-slate-300 font-medium text-sm rounded-none hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X size={15} />
              <span>Cancel</span>
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-7 py-2.5 bg-[#043486] hover:bg-[#0248BC] text-white font-semibold text-sm rounded-none shadow-sm hover:shadow transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save size={16} />
              )}
              <span>Save Changes</span>
            </button>
          </div>
        )}

      </form>
    </div>
  )
}
