import puppeteer from 'puppeteer-core'
import nodemailer from 'nodemailer'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { getPool } from '../config/db.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Locate system Chrome or Edge executable
function getChromeExecutablePath() {
  const possiblePaths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Users\\rishi\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser'
  ]
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) return p
  }
  return null
}

// Convert image file to base64 data URI
function getBase64Image(relativePath) {
  try {
    const fullPath = path.resolve(__dirname, relativePath)
    if (fs.existsSync(fullPath)) {
      const ext = path.extname(fullPath).toLowerCase()
      const mime = ext === '.png' ? 'image/png' : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'image/png'
      const data = fs.readFileSync(fullPath).toString('base64')
      return `data:${mime};base64,${data}`
    }
  } catch (e) {
    console.error('Error reading asset:', relativePath, e)
  }
  return ''
}

/**
 * Generate 100% Exact Pixel-Perfect HTML Template Matching InvoiceTemplate.jsx
 */
export function generateInvoiceHtml(bill, settings = {}) {
  const companyName = settings.company_name || 'SIMCHA INFO SOLUTIONS'
  const companyGstin = settings.gstin || '33GEZPM1178G1ZY'
  const companyPhone = settings.phone || '8122022060'
  const companyEmail = settings.email || 'simchainfosolutions@gmail.com'
  const companyAddress = settings.address || '7A3, Thulasi Ammal Layout 2nd Street, Lakshmipuram, Peelamedu Post, Coimbatore - 641 004.'
  const bankName = settings.bank_name || 'Canara Bank'
  const bankBranch = settings.branch || 'Peelamedu'
  const bankAccountName = settings.account_name || 'Simcha Info Solutions'
  const bankAccountNo = settings.account_no || '120041754011'
  const bankIfsc = settings.ifsc_code || 'CNRB0002732'

  let termsList = []
  if (Array.isArray(settings.terms_conditions)) {
    termsList = settings.terms_conditions
  } else if (typeof settings.terms_conditions === 'string') {
    try {
      termsList = JSON.parse(settings.terms_conditions)
    } catch {
      termsList = [settings.terms_conditions]
    }
  }
  if (!termsList || termsList.length === 0) {
    termsList = [
      'Warranty as per manufacturer’s norms & should be claimed directly.',
      'Warranty claim takes 1 to 8 weeks.',
      'Please carry invoice copy for warranty.',
      'Goods Once Sold will not be taken back or exchanged.'
    ]
  }

  const items = Array.isArray(bill.items) ? bill.items : []
  const isGstInvoice = bill.invoice_type === 'GST' || (!bill.invoice_type && parseFloat(bill.total_tax || 0) > 0)
  const isIntraState = !bill.place_of_supply || bill.place_of_supply.includes('33') || bill.place_of_supply.toLowerCase().includes('tamil nadu')

  const totalQty = items.reduce((sum, it) => sum + (parseFloat(it.quantity) || 0), 0)
  const totalTaxAmt = isGstInvoice ? items.reduce((sum, it) => sum + (parseFloat(it.tax_amount) || 0), 0) : 0
  const totalGrossAmt = items.reduce((sum, it) => sum + (parseFloat(it.amount) || (parseFloat(it.quantity || 0) * parseFloat(it.rate || 0))), 0)

  const formatDate = (dateStr) => {
    if (!dateStr) return new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const formatQty = (qty) => {
    const num = parseFloat(qty) || 0
    return num % 1 === 0 ? parseInt(num, 10) : num
  }

  // Assets
  const logoDataUri = getBase64Image('../../../frontend/src/assets/Logo/Logo-bg-remove.png')
  const watermarkDataUri = getBase64Image('../../../frontend/src/assets/Logo/Favicon.jpeg')

  const itemsRowsHtml = items.map((item) => `
    <tr>
      <td style="padding: 8px 12px; border-right: 1px solid #d1d5db; border-bottom: 1px solid #e5e7eb; vertical-align: top;">
        <div style="font-weight: 700; color: #292424;">${item.item_name || item.name}</div>
        ${item.category_name ? `<div style="font-size: 10px; color: #6b7280; font-weight: 500;">[${item.category_name}]</div>` : ''}
        ${item.serial_number ? `<div style="font-size: 10px; font-family: monospace; font-weight: 600; color: #1f2937; margin-top: 2px;">Serial No.: ${item.serial_number}</div>` : ''}
      </td>
      <td style="padding: 8px 8px; border-right: 1px solid #d1d5db; border-bottom: 1px solid #e5e7eb; text-align: center; font-family: monospace; color: #374151; vertical-align: top;">
        ${item.hsn_code || '-'}
      </td>
      <td style="padding: 8px 8px; border-right: 1px solid #d1d5db; border-bottom: 1px solid #e5e7eb; text-align: center; font-weight: 600; color: #292424; vertical-align: top;">
        ${formatQty(item.quantity)} ${item.unit || 'NOS'}
      </td>
      <td style="padding: 8px 8px; border-right: 1px solid #d1d5db; border-bottom: 1px solid #e5e7eb; text-align: right; font-family: monospace; color: #292424; vertical-align: top;">
        ₹ ${parseFloat(item.rate || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </td>
      <td style="padding: 8px 8px; border-right: 1px solid #d1d5db; border-bottom: 1px solid #e5e7eb; text-align: right; font-family: monospace; color: #374151; font-size: 10px; vertical-align: top;">
        ${isGstInvoice && parseFloat(item.tax_amount || 0) > 0 ? `₹ ${parseFloat(item.tax_amount || 0).toFixed(2)}${item.tax_rate ? ` (${item.tax_rate}%)` : ''}` : '₹ 0.00'}
      </td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-family: monospace; font-weight: 700; color: #292424; vertical-align: top;">
        ₹ ${parseFloat(item.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </td>
    </tr>
  `).join('')

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Invoice - ${bill.invoice_number}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&display=swap');
        
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        body {
          font-family: 'Poppins', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          color: #292424;
          background-color: #ffffff;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        .page-container {
          position: relative;
          width: 210mm;
          min-height: 297mm;
          margin: 0 auto;
          padding: 32px 32px 0 32px;
          background: #ffffff;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .watermark {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
          z-index: 0;
          opacity: 0.06;
        }

        .watermark img {
          width: 320px;
          max-width: 100%;
          filter: grayscale(100%);
        }

        .content {
          position: relative;
          z-index: 10;
        }

        .header-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
        }

        .logo-branding {
          display: flex;
          align-items: flex-start;
          gap: 16px;
        }

        .logo-img {
          height: 85px;
          width: auto;
          object-contain: contain;
        }

        .company-title {
          font-size: 23px;
          font-weight: 900;
          color: #043486;
          line-height: 1.1;
          letter-spacing: -0.5px;
        }

        .company-tagline {
          font-size: 9px;
          font-weight: 700;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-top: 3px;
        }

        .company-address {
          font-size: 10.5px;
          color: #4b5563;
          margin-top: 2px;
          max-width: 480px;
        }

        .company-contact {
          font-size: 10.5px;
          color: #374151;
          margin-top: 2px;
        }

        .gstin-box {
          font-size: 13px;
          font-weight: 700;
          font-family: monospace;
          color: #292424;
          text-align: right;
          white-space: nowrap;
        }

        .divider-blue {
          width: 100%;
          height: 2px;
          background-color: #043486;
          margin-top: 8px;
          margin-bottom: 14px;
        }

        .meta-ribbon {
          background-color: #f3f4f6;
          border: 1px solid #d1d5db;
          padding: 8px 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 11.5px;
          font-weight: 700;
          color: #292424;
          margin-bottom: 14px;
        }

        .meta-label {
          color: #4b5563;
          font-weight: 600;
          text-transform: uppercase;
          margin-right: 6px;
        }

        .customer-card {
          border: 1px solid #d1d5db;
          padding: 12px 14px;
          background-color: rgba(255, 255, 255, 0.9);
          margin-bottom: 14px;
          font-size: 11px;
        }

        .customer-title {
          font-size: 10px;
          font-weight: 900;
          color: #292424;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
        }

        .customer-name {
          font-size: 13.5px;
          font-weight: 700;
          color: #292424;
          margin-bottom: 2px;
        }

        .table-container {
          border: 1px solid #d1d5db;
          margin-bottom: 14px;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 11px;
        }

        thead tr {
          background-color: #f3f4f6;
          border-bottom: 1px solid #d1d5db;
          font-size: 10px;
          font-weight: 900;
          text-transform: uppercase;
        }

        tfoot tr {
          background-color: #f3f4f6;
          border-top: 1px solid #d1d5db;
          font-weight: 700;
          font-size: 11px;
        }

        .bottom-grid {
          display: grid;
          grid-template-columns: 7fr 5fr;
          gap: 24px;
          margin-top: 10px;
        }

        .bank-title, .terms-title {
          font-size: 11px;
          font-weight: 900;
          color: #292424;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 6px;
        }

        .bank-details {
          font-size: 11px;
          color: #1f2937;
          line-height: 1.6;
        }

        .terms-list {
          font-size: 10px;
          color: #374151;
          padding-left: 14px;
          line-height: 1.5;
        }

        .totals-section {
          padding-left: 8px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .totals-row {
          display: flex;
          justify-content: space-between;
          font-size: 11.5px;
          color: #374151;
          padding: 2px 0;
        }

        .grand-total-row {
          border-top: 1px solid #9ca3af;
          border-bottom: 1px solid #9ca3af;
          padding: 6px 0;
          margin: 6px 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 14px;
          font-weight: 900;
          color: #292424;
        }

        .amount-words {
          font-size: 9.5px;
          color: #4b5563;
          margin-top: 2px;
          text-transform: capitalize;
        }

        .signatory-box {
          margin-top: 75px;
          text-align: center;
        }

        .signatory-line {
          width: 220px;
          margin-left: auto;
          border-top: 1px solid #9ca3af;
          padding-top: 6px;
        }

        .footer-ribbon {
          background-color: #043486;
          color: #ffffff;
          padding: 12px 24px;
          margin: 18px -32px 0 -32px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 10.5px;
          font-weight: 500;
        }

        .footer-left {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .footer-pill {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .icon-circle {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background-color: #ffffff;
          color: #043486;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 900;
        }

        .slanted-divider {
          height: 34px;
          width: 1.5px;
          background-color: rgba(255, 255, 255, 0.4);
          transform: rotate(25deg);
          margin: 0 16px;
        }

        .footer-right {
          display: flex;
          align-items: center;
          gap: 8px;
          max-width: 320px;
          line-height: 1.3;
          font-size: 10px;
        }
      </style>
    </head>
    <body>
      <div class="page-container">
        
        <!-- Watermark -->
        <div class="watermark">
          ${watermarkDataUri ? `<img src="${watermarkDataUri}" alt="Watermark" />` : ''}
        </div>

        <div class="content">
          
          <!-- Header -->
          <div class="header-top">
            <div class="logo-branding">
              ${logoDataUri ? `<img src="${logoDataUri}" class="logo-img" alt="Logo" />` : ''}
              <div>
                <h1 class="company-title">${companyName}</h1>
                <p class="company-tagline">IT CONSULTING | HARDWARE &amp; SOFTWARE SOLUTIONS | SALES &amp; SERVICE</p>
                <p class="company-address">${companyAddress}</p>
                <p class="company-contact"><strong>Mobile:</strong> ${companyPhone} &nbsp;|&nbsp; <strong>Email:</strong> ${companyEmail}</p>
              </div>
            </div>
            <div class="gstin-box">
              <span style="color: #6b7280; font-family: 'Poppins', sans-serif; font-size: 11px;">GSTIN: </span>${companyGstin}
            </div>
          </div>

          <div class="divider-blue"></div>

          <!-- Meta Ribbon -->
          <div class="meta-ribbon">
            <div>
              <span class="meta-label">INVOICE NUMBER:</span>
              <span style="font-family: monospace; font-size: 13px; font-weight: 900;">${bill.invoice_number}</span>
            </div>
            <div>
              <span class="meta-label">INVOICE DATE:</span>
              <span>${formatDate(bill.invoice_date)}</span>
            </div>
          </div>

          <!-- Customer Details -->
          <div class="customer-card">
            <div class="customer-title">BILL TO</div>
            <div class="customer-name">${bill.customer_name}</div>
            ${bill.customer_address ? `<div style="color: #374151; margin-bottom: 4px;">${bill.customer_address}</div>` : ''}
            <div style="margin-top: 4px; color: #374151;">
              ${bill.customer_phone ? `<div><strong>Mobile:</strong> <span style="font-family: monospace;">${bill.customer_phone}</span></div>` : ''}
              <div><strong>Place of Supply:</strong> ${bill.place_of_supply || '33-Tamil Nadu'}</div>
              ${bill.customer_gstin ? `<div><strong>Customer GSTIN:</strong> <span style="font-family: monospace; font-weight: bold;">${bill.customer_gstin}</span></div>` : ''}
            </div>
          </div>

          <!-- Line Items Table -->
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th style="padding: 8px 12px; border-right: 1px solid #d1d5db; width: 42%; text-align: left;">ITEMS</th>
                  <th style="padding: 8px 8px; border-right: 1px solid #d1d5db; width: 12%; text-align: center;">HSN/SAC</th>
                  <th style="padding: 8px 8px; border-right: 1px solid #d1d5db; width: 10%; text-align: center;">QTY</th>
                  <th style="padding: 8px 8px; border-right: 1px solid #d1d5db; width: 12%; text-align: right;">RATE (₹)</th>
                  <th style="padding: 8px 8px; border-right: 1px solid #d1d5db; width: 12%; text-align: right;">TAX</th>
                  <th style="padding: 8px 12px; width: 12%; text-align: right;">AMOUNT (₹)</th>
                </tr>
              </thead>
              <tbody>
                ${itemsRowsHtml}
              </tbody>
              <tfoot>
                <tr>
                  <td style="padding: 8px 12px; border-right: 1px solid #d1d5db; text-transform: uppercase;">SUB TOTAL</td>
                  <td style="border-right: 1px solid #d1d5db;"></td>
                  <td style="padding: 8px 8px; border-right: 1px solid #d1d5db; text-align: center; font-family: monospace;">${formatQty(totalQty)}</td>
                  <td style="border-right: 1px solid #d1d5db;"></td>
                  <td style="padding: 8px 8px; border-right: 1px solid #d1d5db; text-align: right; font-family: monospace;">₹ ${totalTaxAmt.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td style="padding: 8px 12px; text-align: right; font-family: monospace; font-weight: 900;">₹ ${totalGrossAmt.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <!-- Bottom Split -->
          <div class="bottom-grid">
            
            <!-- Left: Bank Details & Terms -->
            <div>
              <div style="margin-bottom: 14px;">
                <div class="bank-title">BANK DETAILS</div>
                <div class="bank-details">
                  <div><strong>Beneficiary:</strong> ${bankAccountName}</div>
                  <div><strong>Bank:</strong> ${bankName}</div>
                  <div><strong>Account No:</strong> <span style="font-family: monospace; font-weight: bold;">${bankAccountNo}</span></div>
                  <div><strong>IFSC Code:</strong> <span style="font-family: monospace; font-weight: bold;">${bankIfsc}</span></div>
                  <div><strong>Branch:</strong> ${bankBranch}</div>
                </div>
              </div>

              <div>
                <div class="terms-title">TERMS &amp; CONDITIONS</div>
                <ol class="terms-list">
                  ${termsList.map(t => `<li>${t}</li>`).join('')}
                </ol>
              </div>
            </div>

            <!-- Right: Totals & Signatory -->
            <div class="totals-section">
              <div>
                <div class="totals-row">
                  <span>Taxable Amount</span>
                  <span style="font-family: monospace; font-weight: 600;">₹ ${parseFloat(bill.taxable_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>

                ${isGstInvoice && parseFloat(bill.total_tax || 0) > 0 ? (
                  isIntraState ? `
                    <div class="totals-row" style="font-size: 10.5px;">
                      <span>CGST (${bill.cgst_rate || settings.cgst_rate || 9}%)</span>
                      <span style="font-family: monospace;">₹ ${parseFloat(bill.cgst_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div class="totals-row" style="font-size: 10.5px;">
                      <span>SGST (${bill.sgst_rate || settings.sgst_rate || 9}%)</span>
                      <span style="font-family: monospace;">₹ ${parseFloat(bill.sgst_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  ` : `
                    <div class="totals-row" style="font-size: 10.5px;">
                      <span>IGST (${bill.igst_rate || settings.igst_rate || 18}%)</span>
                      <span style="font-family: monospace;">₹ ${parseFloat(bill.igst_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  `
                ) : ''}

                ${bill.round_off && parseFloat(bill.round_off) !== 0 ? `
                  <div class="totals-row" style="font-size: 10.5px; color: #6b7280;">
                    <span>Round Off</span>
                    <span style="font-family: monospace;">${bill.round_off > 0 ? `+₹${bill.round_off}` : `-₹${Math.abs(bill.round_off)}`}</span>
                  </div>
                ` : ''}

                <div class="grand-total-row">
                  <span>Invoice Total</span>
                  <span style="font-size: 16px; font-family: monospace;">₹ ${parseFloat(bill.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>

                ${bill.amount_in_words ? `
                  <div class="amount-words">
                    <strong>Invoice Amount (in words):</strong>
                    <div style="font-style: italic; color: #292424; font-weight: 500; margin-top: 2px;">${bill.amount_in_words}</div>
                  </div>
                ` : ''}
              </div>

              <!-- Signatory -->
              <div class="signatory-box">
                <div class="signatory-line">
                  <p style="font-size: 10px; color: #4b5563;">Authorized signatory for</p>
                  <p style="font-size: 11px; font-weight: 900; color: #292424; text-transform: uppercase; letter-spacing: 0.5px;">${companyName}</p>
                </div>
              </div>

            </div>

          </div>

        </div>

        <!-- Footer Ribbon Matching letterhead-template.png -->
        <div class="footer-ribbon">
          <div class="footer-left">
            <div class="footer-pill">
              <div class="icon-circle">&#9742;</div>
              <span style="font-weight: 600; letter-spacing: 0.5px;">+91 ${companyPhone}</span>
            </div>
            <div class="footer-pill">
              <div class="icon-circle">&#9993;</div>
              <span style="letter-spacing: 0.3px;">${companyEmail}</span>
            </div>
          </div>

          <div class="slanted-divider"></div>

          <div class="footer-right">
            <div class="icon-circle" style="flex-shrink: 0;">&#9906;</div>
            <span>${companyAddress}</span>
          </div>
        </div>

      </div>
    </body>
    </html>
  `
}

/**
 * Generate 100% Vector PDF Buffer via Headless Chrome / Puppeteer
 */
export async function generateInvoicePdfBuffer(bill, settings = {}) {
  const chromePath = getChromeExecutablePath()
  if (!chromePath) {
    throw new Error('Chrome/Edge executable not found on server to render PDF.')
  }

  const htmlContent = generateInvoiceHtml(bill, settings)

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--font-render-hinting=none'
    ]
  })

  try {
    const page = await browser.newPage()
    await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 2 })
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' })

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' }
    })

    return Buffer.from(pdfBuffer)
  } finally {
    await browser.close()
  }
}

/**
 * Send Invoice PDF Email via configured SMTP
 */
export async function sendInvoiceEmail(billId, customRecipient = null) {
  try {
    const pool = getPool()

    // 1. Fetch Email Config
    const [configRows] = await pool.query('SELECT * FROM email_configs WHERE id = 1')
    if (configRows.length === 0) {
      return { success: false, message: 'Email configurations not found.' }
    }
    const config = configRows[0]

    if (!config.smtp_user || !config.smtp_pass) {
      return { success: false, message: 'SMTP credentials (User/Password) not configured in Settings.' }
    }

    // 2. Fetch Bill Details & Settings
    const [billRows] = await pool.query('SELECT * FROM bills WHERE id = ?', [billId])
    if (billRows.length === 0) {
      return { success: false, message: 'Invoice bill record not found.' }
    }
    const bill = billRows[0]

    const [itemRows] = await pool.query('SELECT * FROM bill_items WHERE bill_id = ? ORDER BY id ASC', [billId])
    bill.items = itemRows

    const [settingsRows] = await pool.query('SELECT * FROM settings WHERE id = 1')
    const settings = settingsRows.length > 0 ? settingsRows[0] : {}

    // 3. Generate Exact Pixel-Perfect PDF Buffer
    const pdfBuffer = await generateInvoicePdfBuffer(bill, settings)

    // 4. Setup Nodemailer Transporter
    const transporter = nodemailer.createTransport({
      host: config.smtp_host || 'smtp.gmail.com',
      port: parseInt(config.smtp_port, 10) || 465,
      secure: config.smtp_port === 465 || config.smtp_secure === 1 || config.smtp_secure === true,
      auth: {
        user: config.smtp_user.trim(),
        pass: config.smtp_pass.trim()
      }
    })

    const recipient = customRecipient || config.recipient_email || config.smtp_user
    const subject = (config.email_subject || 'New Tax Invoice Generated - {invoice_number}')
      .replace('{invoice_number}', bill.invoice_number)
      .replace('{customer_name}', bill.customer_name)

    const formattedDate = new Date(bill.invoice_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    const formattedTotal = `₹ ${parseFloat(bill.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`

    const htmlBody = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 620px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 4px; overflow: hidden;">
        <div style="background-color: #043486; padding: 22px 28px; text-align: left;">
          <h2 style="color: #ffffff; margin: 0; font-size: 20px; letter-spacing: 0.5px;">SIMCHA INFO SOLUTIONS</h2>
          <p style="color: #93c5fd; margin: 4px 0 0 0; font-size: 12px;">Tax Invoice Notification &amp; Receipt</p>
        </div>

        <div style="padding: 26px 28px;">
          <p style="font-size: 14px; color: #334155; margin-top: 0;">Dear <strong>${bill.customer_name}</strong>,</p>
          <p style="font-size: 13.5px; color: #475569; line-height: 1.6;">
            A new invoice has been generated for your billing account. Please find the attached official invoice PDF for your transaction records.
          </p>

          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; padding: 16px; margin: 20px 0;">
            <table style="width: 100%; font-size: 13px; color: #334155; border-collapse: collapse;">
              <tr>
                <td style="padding: 6px 0; color: #64748b;">Invoice Number:</td>
                <td style="padding: 6px 0; font-weight: bold; font-family: monospace; color: #043486;">${bill.invoice_number}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b;">Invoice Date:</td>
                <td style="padding: 6px 0; font-weight: 500;">${formattedDate}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b;">Customer Name:</td>
                <td style="padding: 6px 0; font-weight: 500;">${bill.customer_name}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b;">Total Amount:</td>
                <td style="padding: 6px 0; font-weight: bold; font-size: 15px; color: #043486;">${formattedTotal}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b;">Payment Status:</td>
                <td style="padding: 6px 0;"><span style="background-color: #dcfce7; color: #15803d; padding: 2px 8px; border-radius: 3px; font-size: 11px; font-weight: bold;">${bill.payment_status} (${bill.payment_mode})</span></td>
              </tr>
            </table>
          </div>

          <p style="font-size: 12.5px; color: #64748b; line-height: 1.5;">
            If you have any queries regarding this invoice, please reach out to us at <strong>${settings.phone || '8122022060'}</strong> or reply to this email.
          </p>

          <div style="margin-top: 28px; padding-top: 16px; border-top: 1px solid #f1f5f9; font-size: 12px; color: #94a3b8;">
            Simcha Info Solutions • 7A3, Thulasi Ammal Layout, Peelamedu, Coimbatore - 641004.
          </div>
        </div>
      </div>
    `

    // 5. Send Mail
    const mailOptions = {
      from: `"${config.sender_name || 'Simcha Info Solutions'}" <${config.smtp_user}>`,
      to: recipient,
      subject: subject,
      html: htmlBody,
      attachments: [
        {
          filename: `Invoice_${bill.invoice_number}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    }

    const info = await transporter.sendMail(mailOptions)
    console.log(`📧 Exact Pixel-Perfect Invoice PDF Email dispatched for ${bill.invoice_number} to ${recipient}`)

    return {
      success: true,
      message: `Invoice PDF email sent successfully to ${recipient}`,
      messageId: info.messageId
    }
  } catch (error) {
    console.error('❌ Error sending invoice email:', error)
    return {
      success: false,
      message: error.message || 'Failed to dispatch invoice email via SMTP.'
    }
  }
}

/**
 * Send a quick test email to verify SMTP credentials
 */
export async function sendTestEmail(config) {
  try {
    const transporter = nodemailer.createTransport({
      host: config.smtp_host || 'smtp.gmail.com',
      port: parseInt(config.smtp_port, 10) || 465,
      secure: config.smtp_port === 465 || config.smtp_secure === true || config.smtp_secure === 'true',
      auth: {
        user: config.smtp_user.trim(),
        pass: config.smtp_pass.trim()
      }
    })

    // Verify SMTP connection
    await transporter.verify()

    const targetRecipient = config.recipient_email || config.smtp_user

    const mailOptions = {
      from: `"${config.sender_name || 'Simcha Info Solutions'}" <${config.smtp_user}>`,
      to: targetRecipient,
      subject: '✅ Simcha Billing - SMTP Test Connection Successful',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 550px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 4px; overflow: hidden;">
          <div style="background-color: #043486; padding: 20px; color: white;">
            <h2 style="margin: 0; font-size: 18px;">Simcha Billing - SMTP Verification</h2>
          </div>
          <div style="padding: 20px; color: #334155;">
            <p style="font-size: 14px;">Hello Admin,</p>
            <p style="font-size: 13.5px; line-height: 1.5;">
              This is a test email confirming that your <strong>Simcha Billing SMTP Email Gateway</strong> has been configured successfully and is operational!
            </p>
            <div style="background-color: #f1f5f9; padding: 12px 16px; border-radius: 4px; font-size: 12px; margin: 15px 0;">
              <div><strong>SMTP Host:</strong> ${config.smtp_host}</div>
              <div><strong>Port:</strong> ${config.smtp_port}</div>
              <div><strong>Sender Email:</strong> ${config.smtp_user}</div>
              <div><strong>Timestamp:</strong> ${new Date().toLocaleString()}</div>
            </div>
            <p style="font-size: 12px; color: #16a34a; font-weight: bold;">
              ✓ Automated Bill PDF dispatch is ready to send invoices upon generation.
            </p>
          </div>
        </div>
      `
    }

    const info = await transporter.sendMail(mailOptions)
    return {
      success: true,
      message: `Test email sent successfully to ${targetRecipient}`,
      messageId: info.messageId
    }
  } catch (error) {
    console.error('❌ SMTP Test failed:', error)
    return {
      success: false,
      message: error.message || 'SMTP Authentication failed. Check your email and App Password.'
    }
  }
}
