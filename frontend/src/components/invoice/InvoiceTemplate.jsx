import React from 'react'
import logoImg from '../../assets/Logo/Logo-bg-remove.png'
import faviconWatermark from '../../assets/Logo/Favicon.jpeg'
import { Phone, Mail, MapPin } from 'lucide-react'

// Helper function to paginate invoice items into structured A4 pages
function paginateInvoiceItems(items) {
  if (!items || items.length === 0) {
    return [{
      pageIndex: 1,
      totalPages: 1,
      items: [],
      isFirstPage: true,
      isLastPage: true,
      showSummary: true
    }]
  }

  // 1 to 5 Items: Exact single-page invoice
  if (items.length <= 5) {
    return [{
      pageIndex: 1,
      startIndex: 0,
      items,
      isFirstPage: true,
      isLastPage: true,
      showSummary: true
    }]
  }

  // 6+ Items: Dynamic Multi-Page Mode
  const pages = []
  const total = items.length

  // First page items: 4 to 6 items to allow clean Letterhead and Bill To card
  const firstPageItemCount = total <= 8 ? Math.ceil(total / 2) : 6
  const page1Items = items.slice(0, firstPageItemCount)
  pages.push({
    pageIndex: 1,
    startIndex: 0,
    items: page1Items,
    isFirstPage: true,
    isLastPage: false,
    showSummary: false
  })

  let currentIndex = firstPageItemCount
  while (currentIndex < total) {
    const remaining = total - currentIndex
    // If remaining items <= 6, fit in the final page with summary
    if (remaining <= 6) {
      pages.push({
        pageIndex: pages.length + 1,
        startIndex: currentIndex,
        items: items.slice(currentIndex),
        isFirstPage: false,
        isLastPage: true,
        showSummary: true
      })
      break
    } else {
      // Middle page with up to 10 items
      const chunkSize = Math.min(remaining, 10)
      const isLast = (currentIndex + chunkSize) >= total
      pages.push({
        pageIndex: pages.length + 1,
        startIndex: currentIndex,
        items: items.slice(currentIndex, currentIndex + chunkSize),
        isFirstPage: false,
        isLastPage: isLast,
        showSummary: isLast
      })
      currentIndex += chunkSize
    }
  }

  const totalPages = pages.length
  return pages.map(p => ({ ...p, totalPages }))
}

export default function InvoiceTemplate({ bill, settings }) {
  if (!bill) return null

  // Resolve dynamic settings with fallbacks
  const companyName = settings?.company_name || 'SIMCHA INFO SOLUTIONS'
  const companyGstin = settings?.gstin || '33GEZPM1178G1ZY'
  const companyPhone = settings?.phone || '8122022060'
  const companyEmail = settings?.email || 'simchainfosolutions@gmail.com'
  const companyAddress = settings?.address || '7A3, Thulasi Ammal Layout 2nd Street, Lakshmipuram, Peelamedu Post, Coimbatore - 641 004.'

  const bankName = settings?.bank_name || 'Canara Bank'
  const bankBranch = settings?.branch || 'Peelamedu'
  const bankAccountName = settings?.account_name || 'Simcha Info Solutions'
  const bankAccountNo = settings?.account_no || '120041754011'
  const bankIfsc = settings?.ifsc_code || 'CNRB0002732'

  const termsList = Array.isArray(settings?.terms_conditions) && settings.terms_conditions.length > 0
    ? settings.terms_conditions
    : [
        'Warranty as per manufacturer’s norms & should be claimed directly.',
        'Warranty claim takes 1 to 8 weeks.',
        'Please carry invoice copy for warranty.',
        'Goods Once Sold will not be taken back or exchanged.'
      ]

  const items = Array.isArray(bill.items) ? bill.items : []
  const isGstInvoice = bill.invoice_type === 'GST' || (!bill.invoice_type && parseFloat(bill.total_tax || 0) > 0)
  const isIntraState = !bill.place_of_supply || bill.place_of_supply.includes('33') || bill.place_of_supply.toLowerCase().includes('tamil nadu')

  const totalQty = items.reduce((sum, it) => sum + (parseFloat(it.quantity) || 0), 0)
  const totalTaxAmt = isGstInvoice ? items.reduce((sum, it) => sum + (parseFloat(it.tax_amount) || 0), 0) : 0
  const totalGrossAmt = items.reduce((sum, it) => sum + (parseFloat(it.amount) || (parseFloat(it.quantity || 0) * parseFloat(it.rate || 0))), 0)

  // Format date helper (e.g. 15 Sept 2026)
  const formatDate = (dateStr) => {
    if (!dateStr) return new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  // Format clean integer/decimal quantity (e.g. 1, 11, 2.5)
  const formatQty = (qty) => {
    const num = parseFloat(qty) || 0
    return num % 1 === 0 ? parseInt(num, 10) : num
  }

  const paginatedPages = paginateInvoiceItems(items)

  return (
    <div id="invoice-printable-area" className="w-full">
      {paginatedPages.map((page) => (
        <div
          key={page.pageIndex}
          className="invoice-page relative bg-white text-[#292424] font-['Poppins',sans-serif] w-[210mm] min-h-[297mm] max-h-[297mm] mx-auto p-8 flex flex-col justify-between shadow-lg print:shadow-none print:p-6 print:w-full print:h-[297mm] print:min-h-[297mm] print:max-h-[297mm] text-[12px] leading-relaxed overflow-hidden box-border mb-8 print:mb-0"
          style={{
            pageBreakAfter: page.pageIndex < page.totalPages ? 'always' : 'avoid',
            breakAfter: page.pageIndex < page.totalPages ? 'page' : 'avoid',
            boxSizing: 'border-box'
          }}
        >
          {/* Background Watermark */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 opacity-[0.06]">
            <img
              src={faviconWatermark}
              alt="Favicon Watermark"
              className="w-[320px] max-w-full object-contain filter grayscale"
            />
          </div>

          {/* Main Printable Content */}
          <div className="relative z-10 space-y-3.5 flex-1">
            
            {/* A. Header Section */}
            {page.isFirstPage ? (
              /* --- PAGE 1: Full Official Letterhead Header --- */
              <div className="space-y-1.5">
                <div className="flex items-start justify-between gap-4 pt-1">
                  {/* Left Large Logo + Branding */}
                  <div className="flex items-start gap-4">
                    <img
                      src={logoImg}
                      alt="Simcha Logo"
                      className="h-24 w-auto object-contain shrink-0 -mt-1"
                    />
                    <div className="space-y-0.5">
                      <h1 className="text-2xl font-black text-[#043486] tracking-tight leading-none">
                        {companyName}
                      </h1>
                      <p className="text-[9.5px] font-bold text-gray-500 uppercase tracking-wider pt-0.5">
                        IT CONSULTING | HARDWARE &amp; SOFTWARE SOLUTIONS | SALES &amp; SERVICE
                      </p>
                      <p className="text-[10.5px] text-gray-600 leading-normal truncate max-w-lg">
                        {companyAddress}
                      </p>
                      <p className="text-[10.5px] text-gray-700 font-medium">
                        <strong>Mobile:</strong> {companyPhone} &nbsp;|&nbsp; <strong>Email:</strong> {companyEmail}
                      </p>
                    </div>
                  </div>

                  {/* Top Right: GSTIN Header */}
                  <div className="text-right shrink-0 pt-0.5">
                    <div className="text-sm font-bold text-[#292424] font-mono tracking-wide">
                      <span className="text-gray-500 font-bold font-sans text-xs">GSTIN: </span>
                      {companyGstin}
                    </div>
                  </div>
                </div>

                {/* Thin Divider Rule */}
                <div className="w-full h-[2px] bg-[#043486] mt-2" />
              </div>
            ) : (
              /* --- PAGE 2+: Compact Mini Letterhead Header --- */
              <div className="space-y-1.5 pb-2 border-b-2 border-[#043486]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src={logoImg} alt="Logo" className="h-10 w-auto object-contain" />
                    <div>
                      <h2 className="text-base font-black text-[#043486] leading-none">{companyName}</h2>
                      <p className="text-[9px] text-gray-500 font-bold uppercase mt-0.5">
                        {isGstInvoice ? 'GST TAX INVOICE' : 'INVOICE'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right text-[11px] font-bold text-[#292424]">
                    <div><span className="text-gray-500 font-medium">Date: </span>{formatDate(bill.invoice_date)}</div>
                    <div className="text-[10px] font-mono text-gray-600">GSTIN: {companyGstin}</div>
                  </div>
                </div>
              </div>
            )}

            {/* B. Page 1 Meta Ribbon & Customer Details */}
            {page.isFirstPage && (
              <>
                {/* Invoice Meta Bar */}
                <div className="bg-[#f3f4f6] border border-gray-300 px-4 py-2 flex items-center justify-between text-xs font-bold text-[#292424]">
                  <div className="flex items-center gap-1.5">
                    <span className="text-gray-600 uppercase font-semibold">INVOICE NUMBER:</span>
                    <span className="text-[#292424] font-mono text-sm font-black">{bill.invoice_number}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-gray-600 uppercase font-semibold">INVOICE DATE:</span>
                    <span className="text-[#292424] font-semibold">{formatDate(bill.invoice_date)}</span>
                  </div>
                </div>

                {/* Customer Bill To Details (With Copy Type on Right Side Below Invoice Date) */}
                <div className="border border-gray-300 p-3 bg-white/80 text-[#292424]">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-black text-[#292424] uppercase tracking-wider block mb-0.5">
                        BILL TO
                      </span>
                      <h3 className="text-sm font-bold text-[#292424]">
                        {bill.customer_name}
                      </h3>
                    </div>

                    {/* Copy Type Tag placed right below Invoice Date */}
                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#292424] bg-gray-100 border border-gray-300 px-3 py-1 inline-block">
                        {bill.copy_type === 'DUPLICATE' ? 'DUPLICATE' : (bill.copy_type === 'TRIPLICATE' ? 'TRIPLICATE' : 'ORIGINAL')}
                      </span>
                    </div>
                  </div>

                  {bill.customer_address && (
                    <p className="text-[11px] text-gray-700 leading-snug whitespace-pre-line mt-1">
                      {bill.customer_address}
                    </p>
                  )}
                  <div className="space-y-0.5 pt-1 text-[11px] font-medium text-gray-700">
                    {bill.customer_phone && (
                      <div>
                        <strong>Mobile:</strong> <span className="font-mono text-[#292424]">{bill.customer_phone}</span>
                      </div>
                    )}
                    {bill.customer_email && (
                      <div>
                        <strong>Email:</strong> <span className="text-[#292424]">{bill.customer_email}</span>
                      </div>
                    )}
                    <div>
                      <strong>Place of Supply:</strong> <span className="text-[#292424]">{bill.place_of_supply || '33-Tamil Nadu'}</span>
                    </div>
                    {bill.customer_gstin && (
                      <div>
                        <strong>Customer GSTIN:</strong> <span className="font-mono font-bold uppercase text-[#292424]">{bill.customer_gstin}</span>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* C. Line Items Table for this page */}
            <div className="border border-gray-300 overflow-hidden text-[#292424]">
              <table className="w-full text-left border-collapse text-[11px]">
                <thead>
                  <tr className="bg-[#f3f4f6] border-b border-gray-300 text-[10px] font-black uppercase text-[#292424]">
                    <th className="py-2 px-2 border-r border-gray-300 text-center w-[6%]">S.NO</th>
                    <th className="py-2 px-3 border-r border-gray-300 w-[38%]">ITEMS</th>
                    <th className="py-2 px-2 border-r border-gray-300 text-center w-[12%]">HSN/SAC</th>
                    <th className="py-2 px-2 border-r border-gray-300 text-center w-[10%]">QTY</th>
                    <th className="py-2 px-2 border-r border-gray-300 text-right w-[11%]">RATE (₹)</th>
                    <th className="py-2 px-2 border-r border-gray-300 text-right w-[11%]">TAX</th>
                    <th className="py-2 px-3 text-right w-[12%]">AMOUNT (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-[#292424]">
                  {page.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50">
                      <td className="py-2 px-2 border-r border-gray-300 text-center font-bold align-top text-[#292424]">
                        {(page.startIndex || 0) + idx + 1}
                      </td>
                      <td className="py-2 px-3 border-r border-gray-300 align-top">
                        <div className="font-bold text-[#292424]">
                          {item.item_name || item.name}
                          {item.unit && (
                            <span className="text-[11px] font-semibold text-gray-600 ml-1">
                              ({item.unit})
                            </span>
                          )}
                        </div>
                        {item.category_name && (
                          <div className="text-[10px] text-gray-500 font-medium">
                            [{item.category_name}]
                          </div>
                        )}
                        {item.serial_number && (
                          <div className="text-[10px] font-mono font-semibold text-gray-800 mt-0.5">
                            Serial No.: {item.serial_number}
                          </div>
                        )}
                      </td>
                      <td className="py-2 px-2 border-r border-gray-300 text-center font-mono align-top text-gray-700">
                        {item.hsn_code || '-'}
                      </td>
                      <td className="py-2 px-2 border-r border-gray-300 text-center font-semibold align-top text-[#292424]">
                        {formatQty(item.quantity)} Unit
                      </td>
                      <td className="py-2 px-2 border-r border-gray-300 text-right font-mono align-top text-[#292424]">
                        ₹ {parseFloat(item.rate || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 px-2 border-r border-gray-300 text-right font-mono align-top text-gray-700 text-[10px]">
                        {isGstInvoice && parseFloat(item.tax_amount || 0) > 0 ? (
                          <>
                            ₹ {parseFloat(item.tax_amount || 0).toFixed(2)}
                            {item.tax_rate ? ` (${item.tax_rate}%)` : ''}
                          </>
                        ) : (
                          '₹ 0.00'
                        )}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold align-top text-[#292424]">
                        ₹ {parseFloat(item.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>

                {/* Table Subtotal Bar on Last Page */}
                {page.showSummary && (
                  <tfoot>
                    <tr className="bg-[#f3f4f6] border-t border-gray-300 font-bold text-[11px] text-[#292424]">
                      <td colSpan={2} className="py-2 px-3 border-r border-gray-300 uppercase text-[#292424]">SUB TOTAL</td>
                      <td className="border-r border-gray-300" />
                      <td className="py-2 px-2 border-r border-gray-300 text-center font-mono text-[#292424]">{formatQty(totalQty)} Unit</td>
                      <td className="border-r border-gray-300" />
                      <td className="py-2 px-2 border-r border-gray-300 text-right font-mono text-gray-800">
                        ₹ {totalTaxAmt.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-[#292424] font-black">
                        ₹ {totalGrossAmt.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>

            {/* D. Bottom Two-Column Split (Rendered on Final Page) */}
            {page.showSummary && (
              <div className="grid grid-cols-12 gap-6 pt-2 text-[#292424]">
                
                {/* Left Column: Bank Details & Terms & Conditions */}
                <div className="col-span-7 space-y-3">
                  
                  {/* Bank Details */}
                  <div className="space-y-0.5 text-[11px]">
                    <span className="font-black text-[#292424] uppercase tracking-wider block text-[11px] mb-1">
                      BANK DETAILS
                    </span>
                    <div className="space-y-0.5 text-gray-800 font-medium">
                      <div><strong>Beneficiary:</strong> {bankAccountName}</div>
                      <div><strong>Bank:</strong> {bankName}</div>
                      <div><strong>Account No:</strong> <span className="font-mono font-bold text-[#292424]">{bankAccountNo}</span></div>
                      <div><strong>IFSC Code:</strong> <span className="font-mono font-bold text-[#292424]">{bankIfsc}</span></div>
                      <div><strong>Branch:</strong> {bankBranch}</div>
                    </div>
                  </div>

                  {/* Terms & Conditions */}
                  <div className="space-y-0.5 text-[10px] pt-1">
                    <span className="font-black text-[#292424] uppercase tracking-wider block text-[11px] mb-1">
                      TERMS &amp; CONDITIONS
                    </span>
                    <ol className="list-decimal list-inside space-y-0.5 text-gray-700">
                      {termsList.map((t, idx) => (
                        <li key={idx} className="leading-snug">{t}</li>
                      ))}
                    </ol>
                  </div>

                </div>

                {/* Right Column: Tax Breakdown, Totals & Signatory */}
                <div className="col-span-5 flex flex-col justify-between text-[#292424] pl-2">
                  
                  {/* Tax Computation Table */}
                  <div className="space-y-1 text-[11.5px]">
                    <div className="flex justify-between text-gray-700 py-0.5">
                      <span>Taxable Amount</span>
                      <span className="font-mono font-semibold text-[#292424]">
                        ₹ {parseFloat(bill.taxable_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>

                    {isGstInvoice && parseFloat(bill.total_tax || 0) > 0 && (
                      <>
                        {isIntraState ? (
                          <>
                            <div className="flex justify-between text-gray-700 py-0.5 text-[10.5px]">
                              <span>CGST ({bill.cgst_rate || settings?.cgst_rate || 9}%)</span>
                              <span className="font-mono text-[#292424]">
                                ₹ {parseFloat(bill.cgst_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </div>
                            <div className="flex justify-between text-gray-700 py-0.5 text-[10.5px]">
                              <span>SGST ({bill.sgst_rate || settings?.sgst_rate || 9}%)</span>
                              <span className="font-mono text-[#292424]">
                                ₹ {parseFloat(bill.sgst_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </div>
                          </>
                        ) : (
                          <div className="flex justify-between text-gray-700 py-0.5 text-[10.5px]">
                            <span>IGST ({bill.igst_rate || settings?.igst_rate || 18}%)</span>
                            <span className="font-mono text-[#292424]">
                              ₹ {parseFloat(bill.igst_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                        )}
                      </>
                    )}

                    {bill.round_off && parseFloat(bill.round_off) !== 0 && (
                      <div className="flex justify-between text-gray-500 py-0.5 text-[10.5px]">
                        <span>Round Off</span>
                        <span className="font-mono text-[#292424]">{bill.round_off > 0 ? `+₹${bill.round_off}` : `-₹${Math.abs(bill.round_off)}`}</span>
                      </div>
                    )}

                    {/* Grand Total Row with clean line */}
                    <div className="border-t border-b border-gray-400 py-1.5 my-1 flex justify-between items-center text-sm font-black text-[#292424]">
                      <span>Invoice Total</span>
                      <span className="text-base font-mono font-black">
                        ₹ {parseFloat(bill.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>

                    {/* Amount in words */}
                    {bill.amount_in_words && (
                      <div className="pt-0.5 text-[9.5px] text-gray-600 leading-tight">
                        <strong className="text-gray-800">Invoice Amount (in words):</strong>
                        <p className="italic text-[#292424] font-medium mt-0.5 capitalize">
                          {bill.amount_in_words}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Spacious Authorized Signatory Block */}
                  <div className="pt-8 text-center space-y-1">
                    <div className="w-56 ml-auto border-t border-gray-400 pt-1.5">
                      <p className="text-[10px] text-gray-600 font-medium">Authorized signatory for</p>
                      <p className="text-[11px] font-black text-[#292424] uppercase tracking-wide">
                        {companyName}
                      </p>
                    </div>
                  </div>

                </div>

              </div>
            )}

          </div>

          {/* E. Brand Footer Ribbon with Page Numbering */}
          <div className="relative z-10 -mx-8 -mb-8 mt-4 print:-mx-6 print:-mb-6 overflow-hidden">
            <div className="bg-[#043486] text-white py-3 px-6 flex items-center justify-between text-[10.5px] font-medium">
              
              {/* Left: Phone & Email */}
              <div className="space-y-1 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-4.5 h-4.5 rounded-full bg-white text-[#043486] flex items-center justify-center shrink-0">
                    <Phone size={9} fill="#043486" />
                  </div>
                  <span className="font-semibold tracking-wide">+91 {companyPhone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4.5 h-4.5 rounded-full bg-white text-[#043486] flex items-center justify-center shrink-0">
                    <Mail size={9} />
                  </div>
                  <span className="tracking-wide text-[10px]">{companyEmail}</span>
                </div>
              </div>

              {/* Center Slanted Divider */}
              <div className="h-8 w-[1.5px] bg-white/40 rotate-[25deg] mx-3 shrink-0" />

              {/* Right: Address + Dynamic Page Count */}
              <div className="flex items-center justify-between gap-3 flex-1 max-w-md">
                <div className="flex items-center gap-2">
                  <div className="w-4.5 h-4.5 rounded-full bg-white text-[#043486] flex items-center justify-center shrink-0">
                    <MapPin size={9} fill="#043486" />
                  </div>
                  <span className="leading-tight text-[9.5px] text-blue-100">{companyAddress}</span>
                </div>
                <span className="text-[10px] font-bold text-white bg-blue-950/80 px-2.5 py-1 shrink-0 tracking-wider">
                  Page {page.pageIndex} of {page.totalPages}
                </span>
              </div>

            </div>
          </div>

        </div>
      ))}
    </div>
  )
}
