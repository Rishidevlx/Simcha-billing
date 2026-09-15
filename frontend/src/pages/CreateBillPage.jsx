import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  Receipt,
  Plus,
  Trash2,
  Copy,
  Save,
  RotateCcw,
  User,
  Phone,
  MapPin,
  FileText,
  Boxes,
  Hash,
  IndianRupee,
  CreditCard,
  Building,
  CheckCircle2,
  Calendar
} from 'lucide-react'
import Swal from 'sweetalert2'
import SearchableSelect from '../components/common/SearchableSelect'
import InvoiceTemplate from '../components/invoice/InvoiceTemplate'
import { API_ENDPOINTS } from '../config/api'
import { numberToIndianRupees } from '../utils/numberToWords'

const INDIAN_STATES = [
  '33-Tamil Nadu',
  '32-Kerala',
  '29-Karnataka',
  '37-Andhra Pradesh',
  '36-Telangana',
  '27-Maharashtra',
  '07-Delhi',
  '24-Gujarat',
  '09-Uttar Pradesh',
  '19-West Bengal',
  '08-Rajasthan',
  '23-Madhya Pradesh',
  '06-Haryana',
  '03-Punjab',
  '21-Odisha',
  '10-Bihar',
  '18-Assam',
  '30-Goa',
  '34-Puducherry',
  '99-Other State'
]

export default function CreateBillPage({ setActiveRoute }) {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Invoice Preview Modal State
  const [previewBill, setPreviewBill] = useState(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  // Settings & Materials
  const [settings, setSettings] = useState(null)
  const [materials, setMaterials] = useState([])

  // Bill Meta
  const [invoiceNumber, setInvoiceNumber] = useState('INV-2026-01')
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0])
  const [invoiceType, setInvoiceType] = useState('GST')
  const [copyType, setCopyType] = useState('ORIGINAL')
  const [placeOfSupply, setPlaceOfSupply] = useState('33-Tamil Nadu')

  // Customer Information
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerAddress, setCustomerAddress] = useState('')
  const [customerGstin, setCustomerGstin] = useState('')

  // Payment & Remarks
  const [paymentMode, setPaymentMode] = useState('Cash')
  const [paymentStatus, setPaymentStatus] = useState('Paid')
  const [notes, setNotes] = useState('')

  // Items State (Array of line items)
  const [items, setItems] = useState([
    {
      material_id: '',
      item_name: '',
      category_name: '',
      serial_number: '',
      hsn_code: '',
      quantity: 1,
      unit: 'NOS',
      rate: 0,
      tax_inclusive: true,
      tax_rate: 18.00,
      tax_amount: 0,
      amount: 0,
      has_serial: false
    }
  ])

  // Fetch Next Number, Settings & Materials on load
  const loadInitialData = async () => {
    try {
      setIsLoading(true)
      
      // 1. Fetch Settings
      const settingsRes = await fetch(API_ENDPOINTS.SETTINGS)
      const settingsData = await settingsRes.json()
      if (settingsData.success && settingsData.settings) {
        setSettings(settingsData.settings)
      }

      // 2. Fetch Materials
      const matRes = await fetch(API_ENDPOINTS.MATERIALS)
      const matData = await matRes.json()
      if (matData.success && matData.materials) {
        setMaterials(matData.materials.filter(m => m.status === 'Active'))
      }

      // 3. Fetch Next Invoice Number
      fetchNextInvoiceNumber()

    } catch (err) {
      console.error('Error loading initial billing data:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchNextInvoiceNumber = async () => {
    try {
      const res = await fetch(API_ENDPOINTS.NEXT_INVOICE_NUMBER)
      const data = await res.json()
      if (data.success && data.nextInvoiceNumber) {
        setInvoiceNumber(data.nextInvoiceNumber)
      }
    } catch (err) {
      console.error('Error fetching next invoice number:', err)
    }
  }

  useEffect(() => {
    loadInitialData()
  }, [])

  // Check if Place of Supply is Intra-State (Tamil Nadu)
  const isIntraState = placeOfSupply.includes('33') || placeOfSupply.toLowerCase().includes('tamil nadu')

  // Calculate taxes whenever settings or items change
  const defaultCgst = settings ? parseFloat(settings.cgst_rate) || 9.00 : 9.00
  const defaultSgst = settings ? parseFloat(settings.sgst_rate) || 9.00 : 9.00
  const defaultIgst = settings ? parseFloat(settings.igst_rate) || 18.00 : 18.00
  const activeTaxRate = isIntraState ? (defaultCgst + defaultSgst) : defaultIgst

  // Helper to determine effective tax rate for a material item
  const calculateEffectiveTaxRate = (isTaxEligible, type, intra) => {
    if (type === 'NON_GST') return 0
    if (isTaxEligible === false || isTaxEligible === 0 || isTaxEligible === '0') return 0
    const cgst = settings ? parseFloat(settings.cgst_rate) || 9.00 : 9.00
    const sgst = settings ? parseFloat(settings.sgst_rate) || 9.00 : 9.00
    const igst = settings ? parseFloat(settings.igst_rate) || 18.00 : 18.00
    return intra ? (cgst + sgst) : igst
  }

  // Toggle between NON_GST and GST TAX INVOICE
  const handleToggleInvoiceType = (newType) => {
    setInvoiceType(newType)
    setItems(prevItems => {
      return prevItems.map(it => {
        const qty = parseFloat(it.quantity) || 0
        const rate = parseFloat(it.rate) || 0
        const taxable = qty * rate
        const isTaxEligible = it.tax_inclusive !== false && it.tax_inclusive !== 0 && it.tax_inclusive !== '0'
        const effRate = calculateEffectiveTaxRate(isTaxEligible, newType, isIntraState)
        const taxAmt = taxable * (effRate / 100)
        const totalAmt = taxable + taxAmt
        return {
          ...it,
          tax_rate: effRate,
          tax_amount: parseFloat(taxAmt.toFixed(2)),
          amount: parseFloat(totalAmt.toFixed(2))
        }
      })
    })
  }

  // Handle Place of Supply Change
  const handlePlaceOfSupplyChange = (newPlace) => {
    const val = newPlace || '33-Tamil Nadu'
    setPlaceOfSupply(val)
    const newIsIntra = val.includes('33') || val.toLowerCase().includes('tamil nadu')
    setItems(prevItems => {
      return prevItems.map(it => {
        const qty = parseFloat(it.quantity) || 0
        const rate = parseFloat(it.rate) || 0
        const taxable = qty * rate
        const isTaxEligible = it.tax_inclusive !== false && it.tax_inclusive !== 0 && it.tax_inclusive !== '0'
        const effRate = calculateEffectiveTaxRate(isTaxEligible, invoiceType, newIsIntra)
        const taxAmt = taxable * (effRate / 100)
        const totalAmt = taxable + taxAmt
        return {
          ...it,
          tax_rate: effRate,
          tax_amount: parseFloat(taxAmt.toFixed(2)),
          amount: parseFloat(totalAmt.toFixed(2))
        }
      })
    })
  }

  // Add Keyboard Shortcut Listeners
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl + S or Ctrl + Enter: Save
      if ((e.ctrlKey || e.metaKey) && (e.key === 'Enter' || e.key === 's')) {
        e.preventDefault()
        handleSubmit(e)
      }
      // Alt + A or F2: Add Line Item
      else if ((e.altKey && (e.key === 'a' || e.key === 'A')) || e.key === 'F2') {
        e.preventDefault()
        handleAddItem()
      }
      // Alt + R: Reset
      else if (e.altKey && (e.key === 'r' || e.key === 'R')) {
        e.preventDefault()
        handleReset()
      }
      // F8: Cash
      else if (e.key === 'F8') {
        e.preventDefault()
        setPaymentMode('Cash')
      }
      // F9: UPI
      else if (e.key === 'F9') {
        e.preventDefault()
        setPaymentMode('UPI')
      }
      // F10: Credit
      else if (e.key === 'F10') {
        e.preventDefault()
        setPaymentMode('Credit')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [items, customerName, customerPhone, customerAddress, customerGstin, placeOfSupply, invoiceNumber, invoiceDate, invoiceType, copyType, paymentMode, paymentStatus, notes, settings])

  // Handle Material Selection for an item row with duplicate detection
  const handleMaterialSelect = (index, materialId) => {
    const selectedMat = materials.find(m => String(m.id) === String(materialId))
    
    if (selectedMat) {
      // Check if item already selected in another row
      const isDuplicate = items.some((it, i) => i !== index && String(it.material_id) === String(materialId))
      if (isDuplicate) {
        Swal.mixin({
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true
        }).fire({
          icon: 'info',
          title: `"${selectedMat.name}" is already in the bill.`
        })
      }
    }

    setItems(prevItems => {
      const updated = [...prevItems]
      if (selectedMat) {
        const qty = updated[index].quantity || 1
        const rate = parseFloat(selectedMat.selling_price) || 0
        const taxable = qty * rate
        const isTaxEligible = selectedMat.tax_inclusive !== false && selectedMat.tax_inclusive !== 0 && selectedMat.tax_inclusive !== '0'
        const effectiveTaxRate = calculateEffectiveTaxRate(isTaxEligible, invoiceType, isIntraState)
        const taxAmt = taxable * (effectiveTaxRate / 100)
        const totalAmt = taxable + taxAmt

        updated[index] = {
          ...updated[index],
          material_id: selectedMat.id,
          item_name: selectedMat.name,
          category_name: selectedMat.category_name || '',
          hsn_code: selectedMat.hsn_code || '',
          unit: selectedMat.unit || 'NOS',
          rate: rate,
          tax_inclusive: isTaxEligible,
          tax_rate: effectiveTaxRate,
          tax_amount: parseFloat(taxAmt.toFixed(2)),
          amount: parseFloat(totalAmt.toFixed(2)),
          has_serial: Boolean(selectedMat.serial_tracking)
        }
      } else {
        updated[index] = {
          ...updated[index],
          material_id: '',
          item_name: '',
          category_name: '',
          serial_number: '',
          hsn_code: '',
          rate: 0,
          unit: 'NOS',
          tax_inclusive: true,
          tax_rate: invoiceType === 'GST' ? activeTaxRate : 0,
          tax_amount: 0,
          amount: 0,
          has_serial: false
        }
      }
      return updated
    })
  }

  // Handle Input Changes on Item Row
  const handleItemChange = (index, field, value) => {
    setItems(prevItems => {
      const updated = [...prevItems]
      updated[index] = { ...updated[index], [field]: value }

      // Recalculate row amounts
      const qty = parseFloat(field === 'quantity' ? value : updated[index].quantity) || 0
      const rate = parseFloat(field === 'rate' ? value : updated[index].rate) || 0
      const taxRate = parseFloat(field === 'tax_rate' ? value : updated[index].tax_rate) || 0

      const taxable = qty * rate
      const taxAmt = taxable * (taxRate / 100)
      const totalAmt = taxable + taxAmt

      updated[index].tax_amount = parseFloat(taxAmt.toFixed(2))
      updated[index].amount = parseFloat(totalAmt.toFixed(2))

      return updated
    })
  }

  // Add Item Row
  const handleAddItem = () => {
    setItems(prev => [
      ...prev,
      {
        material_id: '',
        item_name: '',
        category_name: '',
        serial_number: '',
        hsn_code: '',
        quantity: 1,
        unit: 'NOS',
        rate: 0,
        tax_inclusive: true,
        tax_rate: invoiceType === 'GST' ? activeTaxRate : 0,
        tax_amount: 0,
        amount: 0,
        has_serial: false
      }
    ])
  }

  // Duplicate Item Row
  const handleDuplicateItem = (index) => {
    const itemToClone = items[index]
    setItems(prev => [
      ...prev.slice(0, index + 1),
      { ...itemToClone, serial_number: '' },
      ...prev.slice(index + 1)
    ])
  }

  // Remove Item Row
  const handleRemoveItem = (index) => {
    if (items.length === 1) {
      Swal.fire({
        icon: 'warning',
        title: 'At least one item required',
        text: 'A bill must have at least one line item.',
        confirmButtonColor: '#043486'
      })
      return
    }
    setItems(prev => prev.filter((_, i) => i !== index))
  }

  // Aggregate Bill Calculations
  const taxableAmount = items.reduce((sum, item) => sum + ((parseFloat(item.quantity) || 0) * (parseFloat(item.rate) || 0)), 0)
  const totalTax = invoiceType === 'GST' ? items.reduce((sum, item) => sum + (parseFloat(item.tax_amount) || 0), 0) : 0

  const cgstAmount = (invoiceType === 'GST' && isIntraState) ? (totalTax / 2) : 0
  const sgstAmount = (invoiceType === 'GST' && isIntraState) ? (totalTax / 2) : 0
  const igstAmount = (invoiceType === 'GST' && !isIntraState) ? totalTax : 0

  const rawGrandTotal = taxableAmount + totalTax
  const roundedGrandTotal = Math.round(rawGrandTotal)
  const roundOff = parseFloat((roundedGrandTotal - rawGrandTotal).toFixed(2))
  const amountInWords = numberToIndianRupees(roundedGrandTotal)

  // Reset form
  const handleReset = () => {
    setCustomerName('')
    setCustomerPhone('')
    setCustomerAddress('')
    setCustomerGstin('')
    setNotes('')
    setPaymentMode('Cash')
    setPaymentStatus('Paid')
    setItems([
      {
        material_id: '',
        item_name: '',
        category_name: '',
        serial_number: '',
        hsn_code: '',
        quantity: 1,
        unit: 'NOS',
        rate: 0,
        tax_inclusive: true,
        tax_rate: invoiceType === 'GST' ? activeTaxRate : 0,
        tax_amount: 0,
        amount: 0,
        has_serial: false
      }
    ])
    fetchNextInvoiceNumber()
  }

  // Submit & Save Bill
  const handleSubmit = async (e, isSaveAndNew = false) => {
    if (e && e.preventDefault) e.preventDefault()

    if (!customerName.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Customer Name Required',
        text: 'Please enter the Customer / Client name.',
        confirmButtonColor: '#043486'
      })
      return
    }

    // 10-digit mobile number validation
    if (customerPhone.trim() && customerPhone.trim().length !== 10) {
      Swal.fire({
        icon: 'warning',
        title: 'Invalid Mobile Number',
        text: 'Mobile number must be exactly 10 digits.',
        confirmButtonColor: '#043486'
      })
      return
    }

    const validItems = items.filter(item => item.item_name && item.item_name.trim())
    if (validItems.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No Valid Items',
        text: 'Please select at least one material for this invoice.',
        confirmButtonColor: '#043486'
      })
      return
    }

    setIsSaving(true)

    try {
      const payload = {
        invoice_number: invoiceNumber.trim(),
        invoice_date: invoiceDate,
        invoice_type: invoiceType,
        copy_type: copyType,
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        customer_address: customerAddress.trim(),
        customer_gstin: customerGstin.trim(),
        place_of_supply: placeOfSupply,
        taxable_amount: parseFloat(taxableAmount.toFixed(2)),
        cgst_rate: defaultCgst,
        cgst_amount: parseFloat(cgstAmount.toFixed(2)),
        sgst_rate: defaultSgst,
        sgst_amount: parseFloat(sgstAmount.toFixed(2)),
        igst_rate: defaultIgst,
        igst_amount: parseFloat(igstAmount.toFixed(2)),
        total_tax: parseFloat(totalTax.toFixed(2)),
        round_off: roundOff,
        total_amount: roundedGrandTotal,
        amount_in_words: amountInWords,
        payment_mode: paymentMode,
        payment_status: paymentStatus,
        notes: notes.trim(),
        items: validItems
      }

      const res = await fetch(API_ENDPOINTS.BILLS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to save bill')
      }

      if (isSaveAndNew) {
        Swal.mixin({
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true
        }).fire({
          icon: 'success',
          title: `Invoice ${invoiceNumber} saved! Ready for next.`
        })
        handleReset()
      } else {
        const savedBillData = {
          ...payload,
          id: data.billId,
          items: validItems
        }
        setPreviewBill(savedBillData)

        Swal.fire({
          icon: 'success',
          title: 'Invoice Created Successfully!',
          text: `Invoice #${invoiceNumber} saved. Auto-dispatching email & opening print...`,
          showConfirmButton: false,
          timer: 1200
        })

        setTimeout(() => {
          window.print()
          handleReset()
          loadInitialData()
        }, 500)
      }

    } catch (err) {
      console.error('Error saving invoice:', err)
      Swal.fire({
        icon: 'error',
        title: 'Error Saving Invoice',
        text: err.message || 'Unable to save bill to database.',
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

  const materialOptions = materials.map(m => ({
    value: m.id,
    label: `${m.name} ${m.code ? `(${m.code})` : ''}`,
    subLabel: `${m.category_name ? `[${m.category_name}] • ` : ''}₹${m.selling_price} / ${m.unit || 'NOS'}`
  }))

  const stateOptions = INDIAN_STATES.map(st => ({
    value: st,
    label: st
  }))

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16 font-['Poppins',sans-serif]">
      
      {/* 1. Page Header & Quick Shortcuts Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-none border border-gray-200 dark:border-slate-800 shadow-sm transition-colors">
        <div>
          <h1 className="text-xl font-bold text-[#292424] dark:text-white">Create New Invoice</h1>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">Generate customer invoice with automated GST taxes and live currency calculation.</p>
        </div>

        {/* Keyboard Shortcuts Hint Bar */}
        <div className="hidden md:flex items-center gap-2 text-[11px] text-gray-500 dark:text-slate-400 bg-gray-50 dark:bg-slate-950 px-3 py-1.5 border border-gray-200 dark:border-slate-800">
          <span><kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 font-mono text-[10px] font-bold text-[#043486] dark:text-blue-400">Ctrl+Enter</kbd> Save</span>
          <span>•</span>
          <span><kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 font-mono text-[10px] font-bold text-[#043486] dark:text-blue-400">Alt+A</kbd> Add Item</span>
          <span>•</span>
          <span><kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 font-mono text-[10px] font-bold text-[#043486] dark:text-blue-400">Alt+R</kbd> Reset</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* 2. Responsive Split Screen Layout (Left 8 Cols: Forms & Items | Right 4 Cols: Sticky Live Summary) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* ================= LEFT MAIN COLUMN (8 COLS) ================= */}
          <div className="lg:col-span-8 space-y-6">

            {/* A. Invoice Specifications */}
            <div className="bg-white dark:bg-slate-900 rounded-none border border-gray-200 dark:border-slate-800 p-6 shadow-sm space-y-5 transition-colors">
              <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-slate-800">
                <h2 className="text-sm font-bold text-[#043486] dark:text-blue-400 tracking-wide uppercase flex items-center gap-2">
                  <FileText size={16} />
                  <span>Invoice Specifications</span>
                </h2>

                {/* Non-GST / GST Toggle */}
                <div className="flex items-center bg-gray-100 dark:bg-slate-800 p-1 rounded-none border border-gray-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => handleToggleInvoiceType('NON_GST')}
                    className={`px-3.5 py-1.5 text-xs font-semibold rounded-none transition-all cursor-pointer ${
                      invoiceType === 'NON_GST'
                        ? 'bg-[#043486] text-white shadow-sm'
                        : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    NON-GST INVOICE
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleInvoiceType('GST')}
                    className={`px-3.5 py-1.5 text-xs font-semibold rounded-none transition-all cursor-pointer ${
                      invoiceType === 'GST'
                        ? 'bg-[#043486] text-white shadow-sm'
                        : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    GST TAX INVOICE
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1.5">Invoice Date *</label>
                  <input
                    type="date"
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    required
                    className="w-full px-4 py-3 text-sm text-[#292424] dark:text-white bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-none focus:outline-none focus:border-[#043486] dark:focus:border-blue-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1.5">Place of Supply *</label>
                  <SearchableSelect
                    options={stateOptions}
                    value={placeOfSupply}
                    onChange={handlePlaceOfSupplyChange}
                    placeholder="Select or search state..."
                  />
                </div>
              </div>
            </div>

            {/* B. Customer Details */}
            <div className="bg-white dark:bg-slate-900 rounded-none border border-gray-200 dark:border-slate-800 p-6 shadow-sm space-y-5 transition-colors">
              <div className="flex items-center gap-2 pb-3 border-b border-gray-200 dark:border-slate-800">
                <User size={16} className="text-[#043486] dark:text-blue-400" />
                <h2 className="text-sm font-bold text-[#043486] dark:text-blue-400 tracking-wide uppercase">
                  Bill To / Customer Details
                </h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1.5">Customer / Client Name *</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    required
                    placeholder="Enter customer / client name"
                    className="w-full px-4 py-3 text-sm text-[#292424] dark:text-white bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-none focus:outline-none focus:border-[#043486] dark:focus:border-blue-500 font-semibold placeholder:text-gray-400 dark:placeholder:text-slate-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1.5">
                    Mobile / Phone Number <span className="text-gray-400 text-[11px] font-normal">(10 Digits)</span>
                  </label>
                  <input
                    type="tel"
                    maxLength={10}
                    value={customerPhone}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 10)
                      setCustomerPhone(val)
                    }}
                    placeholder="Enter 10-digit mobile number"
                    className="w-full px-4 py-3 text-sm text-[#292424] dark:text-white bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-none focus:outline-none focus:border-[#043486] dark:focus:border-blue-500 font-mono font-medium placeholder:text-gray-400 dark:placeholder:text-slate-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1.5">Customer GSTIN (Optional)</label>
                  <input
                    type="text"
                    value={customerGstin}
                    onChange={(e) => setCustomerGstin(e.target.value.toUpperCase())}
                    placeholder="Enter GSTIN (optional)"
                    className="w-full px-4 py-3 text-sm text-[#292424] dark:text-white uppercase bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-none focus:outline-none focus:border-[#043486] dark:focus:border-blue-500 font-mono font-medium placeholder:text-gray-400 dark:placeholder:text-slate-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1.5">Billing Address</label>
                  <textarea
                    rows={3}
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    placeholder="Enter billing address"
                    className="w-full px-4 py-3 text-sm text-[#292424] dark:text-white bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-none focus:outline-none focus:border-[#043486] dark:focus:border-blue-500 font-medium placeholder:text-gray-400 dark:placeholder:text-slate-500"
                  />
                </div>
              </div>
            </div>

            {/* C. Line Items Grid */}
            <div className="bg-white dark:bg-slate-900 rounded-none border border-gray-200 dark:border-slate-800 p-6 shadow-sm space-y-4 transition-colors">
              <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Boxes size={16} className="text-[#043486] dark:text-blue-400" />
                  <h2 className="text-sm font-bold text-[#043486] dark:text-blue-400 tracking-wide uppercase">
                    Invoice Line Items ({items.length})
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={handleAddItem}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900 text-[#043486] dark:text-blue-300 font-semibold text-xs rounded-none border border-blue-200 dark:border-blue-900 transition-colors cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Add Line Item (Alt+A)</span>
                </button>
              </div>

              <div className="space-y-4">
                {items.map((item, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-none border border-gray-300 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950/60 hover:border-blue-300 dark:hover:border-blue-800 transition-all space-y-3"
                  >
                    {/* Row Top: Material Selection + Custom Description + Category + Actions */}
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
                      <span className="w-7 h-7 rounded-none bg-[#043486] text-white text-xs font-bold flex items-center justify-center shrink-0">
                        {index + 1}
                      </span>

                      {/* Material Dropdown */}
                      <div className="w-full md:w-72">
                        <SearchableSelect
                          options={materialOptions}
                          value={item.material_id}
                          onChange={(val) => handleMaterialSelect(index, val)}
                          placeholder="Select or search material..."
                        />
                      </div>

                      {/* Category Tag/Field */}
                      <div className="w-full md:w-44 shrink-0">
                        <input
                          type="text"
                          value={item.category_name || ''}
                          onChange={(e) => handleItemChange(index, 'category_name', e.target.value)}
                          placeholder="Category"
                          className="w-full px-3 py-2.5 text-xs text-[#043486] dark:text-blue-300 bg-blue-50/50 dark:bg-slate-900 border border-blue-200 dark:border-slate-700 rounded-none focus:outline-none focus:border-[#043486] dark:focus:border-blue-500 font-semibold placeholder:text-gray-400 dark:placeholder:text-slate-500"
                          title="Product Category"
                        />
                      </div>

                      {/* Material Name Custom Input */}
                      <div className="flex-1 w-full">
                        <input
                          type="text"
                          value={item.item_name}
                          onChange={(e) => handleItemChange(index, 'item_name', e.target.value)}
                          placeholder="Enter item description / name"
                          required
                          className="w-full px-4 py-2.5 text-sm text-[#292424] dark:text-white bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-none focus:outline-none focus:border-[#043486] dark:focus:border-blue-500 placeholder:text-gray-400 dark:placeholder:text-slate-500"
                        />
                      </div>

                      {/* Row Actions */}
                      <div className="flex items-center gap-1 shrink-0 self-end md:self-center">
                        <button
                          type="button"
                          onClick={() => handleDuplicateItem(index)}
                          title="Duplicate row"
                          className="p-2 text-gray-400 hover:text-[#043486] dark:hover:text-blue-400 hover:bg-white dark:hover:bg-slate-800 rounded-none transition-colors cursor-pointer"
                        >
                          <Copy size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          title="Delete row"
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-none transition-colors cursor-pointer"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    {/* Row Bottom: Serial No, HSN, Qty, Unit, Rate, Tax, Line Total */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 pt-2 border-t border-gray-200 dark:border-slate-800">
                      
                      {/* Serial Number */}
                      <div className="col-span-2 sm:col-span-1">
                        <label className="block text-[11px] font-semibold text-gray-500 dark:text-slate-400 mb-1">
                          Serial Number {item.has_serial && <span className="text-blue-500">*</span>}
                        </label>
                        <input
                          type="text"
                          value={item.serial_number}
                          onChange={(e) => handleItemChange(index, 'serial_number', e.target.value)}
                          placeholder="Enter serial number"
                          className="w-full px-3 py-2 text-xs font-mono text-[#292424] dark:text-white bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-none focus:outline-none focus:border-[#043486] dark:focus:border-blue-500 placeholder:text-gray-400 dark:placeholder:text-slate-500"
                        />
                      </div>

                      {/* HSN / SAC */}
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-500 dark:text-slate-400 mb-1">HSN / SAC</label>
                        <input
                          type="text"
                          value={item.hsn_code}
                          onChange={(e) => handleItemChange(index, 'hsn_code', e.target.value)}
                          placeholder="Enter HSN / SAC"
                          className="w-full px-3 py-2 text-xs font-mono text-[#292424] dark:text-white bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-none focus:outline-none focus:border-[#043486] dark:focus:border-blue-500 placeholder:text-gray-400 dark:placeholder:text-slate-500"
                        />
                      </div>

                      {/* Quantity & Unit */}
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-500 dark:text-slate-400 mb-1">Qty & Unit</label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min="0.01"
                            step="any"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                            className="w-16 px-2 py-2 text-xs text-center font-bold text-[#292424] dark:text-white bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-none focus:outline-none focus:border-[#043486] dark:focus:border-blue-500"
                          />
                          <input
                            type="text"
                            value={item.unit}
                            onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                            className="w-14 px-1.5 py-2 text-xs text-center uppercase text-[#292424] dark:text-white bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-none focus:outline-none focus:border-[#043486] dark:focus:border-blue-500 font-medium"
                          />
                        </div>
                      </div>

                      {/* Rate (Base Price) */}
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-500 dark:text-slate-400 mb-1">Rate (₹)</label>
                        <input
                          type="number"
                          step="any"
                          min="0"
                          value={item.rate}
                          onChange={(e) => handleItemChange(index, 'rate', e.target.value)}
                          className="w-full px-3 py-2 text-xs font-semibold text-[#292424] dark:text-white bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-none focus:outline-none focus:border-[#043486] dark:focus:border-blue-500"
                        />
                      </div>

                      {/* Tax % */}
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-500 dark:text-slate-400 mb-1">Tax ({item.tax_rate}%)</label>
                        <div className="px-3 py-2 text-xs bg-gray-100 dark:bg-slate-800 rounded-none border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 font-medium">
                          ₹ {item.tax_amount.toFixed(2)}
                        </div>
                      </div>

                      {/* Total Line Amount */}
                      <div>
                        <label className="block text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 mb-1">Amount (₹)</label>
                        <div className="px-3 py-2 text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 rounded-none">
                          ₹ {item.amount.toFixed(2)}
                        </div>
                      </div>

                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* D. Payment Mode & Remarks */}
            <div className="bg-white dark:bg-slate-900 rounded-none border border-gray-200 dark:border-slate-800 p-6 shadow-sm space-y-4 transition-colors">
              <h2 className="text-sm font-bold text-[#043486] dark:text-blue-400 tracking-wide uppercase flex items-center gap-2 pb-3 border-b border-gray-200 dark:border-slate-800">
                <CreditCard size={16} />
                <span>Payment & Remarks</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1.5">Payment Method</label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm text-[#292424] dark:text-white bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-none focus:outline-none focus:border-[#043486] dark:focus:border-blue-500 font-medium"
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI / GPay</option>
                    <option value="Bank Transfer">Bank Transfer / NEFT</option>
                    <option value="Card">Credit / Debit Card</option>
                    <option value="Credit">Credit (Unpaid)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1.5">Payment Status</label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value)}
                    className={`w-full px-3.5 py-2.5 text-sm border rounded-none focus:outline-none font-bold ${
                      paymentStatus === 'Paid'
                        ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800'
                        : paymentStatus === 'Partial'
                        ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800'
                        : 'bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-400 border-red-300 dark:border-red-800'
                    }`}
                  >
                    <option value="Paid">Paid</option>
                    <option value="Partial">Partial</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1.5">Notes / Custom Remarks</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Enter notes or remarks (optional)..."
                  className="w-full px-4 py-2.5 text-sm text-[#292424] dark:text-white bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-none focus:outline-none focus:border-[#043486] dark:focus:border-blue-500 placeholder:text-gray-400 dark:placeholder:text-slate-500"
                />
              </div>
            </div>

          </div>

          {/* ================= RIGHT STICKY SUMMARY COLUMN (4 COLS) ================= */}
          <div className="lg:col-span-4 lg:sticky lg:top-20 space-y-4">
            
            {/* Live Invoice Summary Card */}
            <div className="bg-white dark:bg-slate-900 rounded-none border border-gray-200 dark:border-slate-800 p-6 shadow-sm space-y-4 transition-colors">
              <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-slate-800">
                <h2 className="text-sm font-bold text-[#043486] dark:text-blue-400 tracking-wide uppercase flex items-center gap-2">
                  <IndianRupee size={16} />
                  <span>Invoice Summary</span>
                </h2>
                <span className="px-2.5 py-1 bg-blue-50 dark:bg-blue-950/60 text-[#043486] dark:text-blue-300 border border-blue-200 dark:border-blue-900 text-xs font-mono font-bold">
                  {invoiceNumber}
                </span>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between text-gray-600 dark:text-slate-400">
                  <span>Taxable Amount</span>
                  <span className="font-medium font-mono text-gray-900 dark:text-white">₹ {taxableAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>

                {isIntraState ? (
                  <>
                    <div className="flex items-center justify-between text-gray-600 dark:text-slate-400 text-xs">
                      <span>CGST ({defaultCgst}%)</span>
                      <span className="font-mono text-gray-800 dark:text-slate-200">₹ {cgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex items-center justify-between text-gray-600 dark:text-slate-400 text-xs">
                      <span>SGST ({defaultSgst}%)</span>
                      <span className="font-mono text-gray-800 dark:text-slate-200">₹ {sgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-between text-gray-600 dark:text-slate-400 text-xs">
                    <span>IGST ({defaultIgst}%)</span>
                    <span className="font-mono text-gray-800 dark:text-slate-200">₹ {igstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-gray-600 dark:text-slate-400">
                  <span>Total Tax</span>
                  <span className="font-medium font-mono text-blue-900 dark:text-blue-300">₹ {totalTax.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>

                {roundOff !== 0 && (
                  <div className="flex items-center justify-between text-gray-500 dark:text-slate-400 text-xs">
                    <span>Round Off</span>
                    <span className="font-mono">{roundOff > 0 ? `+₹${roundOff}` : `-₹${Math.abs(roundOff)}`}</span>
                  </div>
                )}

                <div className="pt-3 border-t border-gray-200 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-sm font-bold text-[#292424] dark:text-white">Grand Total</span>
                  <span className="text-2xl font-black text-[#043486] dark:text-blue-400 font-mono">
                    ₹ {roundedGrandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                {/* Amount in words badge */}
                <div className="p-3 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-none">
                  <span className="block text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Amount in Words</span>
                  <p className="text-xs font-semibold text-[#043486] dark:text-blue-300 mt-0.5 capitalize leading-relaxed">
                    {amountInWords}
                  </p>
                </div>

                {/* Bank details summary pill */}
                {settings && (
                  <div className="p-3 bg-gray-50 dark:bg-slate-950 rounded-none border border-gray-200 dark:border-slate-800 text-[11px] text-gray-600 dark:text-slate-400 space-y-0.5">
                    <p className="font-semibold text-gray-800 dark:text-slate-200">Bank: {settings.bank_name} ({settings.branch || 'Main'})</p>
                    <p>A/C: <span className="font-mono text-gray-900 dark:text-white font-bold">{settings.account_no}</span> | IFSC: <span className="font-mono text-gray-900 dark:text-white font-bold">{settings.ifsc_code}</span></p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-gray-200 dark:border-slate-800 space-y-2">
                <button
                  type="button"
                  onClick={(e) => handleSubmit(e, false)}
                  disabled={isSaving}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-[#043486] hover:bg-[#0248BC] text-white font-bold text-sm rounded-none shadow-sm hover:shadow transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer"
                >
                  {isSaving ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save size={16} />
                  )}
                  <span>Save Invoice (Ctrl+Enter)</span>
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  className="w-full flex items-center justify-center gap-2 py-2 border border-gray-300 dark:border-slate-700 text-gray-600 dark:text-slate-300 font-medium text-xs rounded-none hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <RotateCcw size={13} />
                  <span>Reset Form (Alt+R)</span>
                </button>
              </div>

            </div>

          </div>

        </div>

      </form>

      {/* Direct Printable Invoice Portal to document.body for reliable A4 print without blank page */}
      {previewBill && typeof document !== 'undefined' && createPortal(
        <div id="invoice-print-wrapper">
          <InvoiceTemplate bill={previewBill} settings={settings} />
        </div>,
        document.body
      )}
    </div>
  )
}
