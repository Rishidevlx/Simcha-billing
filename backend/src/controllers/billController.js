import { getPool } from '../config/db.js'
import { sendInvoiceEmail } from '../services/emailService.js'

// Generate next formatted invoice number
export async function getNextInvoiceNumber(req, res) {
  try {
    const pool = getPool()
    
    // Get prefix from settings
    const [settingRows] = await pool.query('SELECT invoice_prefix FROM settings WHERE id = 1')
    let rawPrefix = settingRows.length > 0 && settingRows[0].invoice_prefix ? settingRows[0].invoice_prefix.trim() : 'INV-2026'
    
    // Ensure clean prefix ending with hyphen
    const prefix = rawPrefix.endsWith('-') ? rawPrefix : `${rawPrefix}-`

    // Extract sequence numbers from bills with clean sequential format
    const [rows] = await pool.query('SELECT invoice_number FROM bills')
    let maxSeq = 0
    for (const r of rows) {
      if (r.invoice_number) {
        const invStr = r.invoice_number.trim()
        const parts = invStr.split('-')
        const lastPart = parts[parts.length - 1]
        const num = parseInt(lastPart, 10)
        // If last segment is a clean sequence number (e.g. 01, 02, 1, 2 up to 9999)
        if (!isNaN(num) && lastPart.length <= 4 && num < 10000) {
          if (num > maxSeq) {
            maxSeq = num
          }
        }
      }
    }

    const nextNum = maxSeq + 1
    const formattedNumber = `${prefix}${String(nextNum).padStart(2, '0')}`

    return res.status(200).json({
      success: true,
      nextInvoiceNumber: formattedNumber
    })
  } catch (error) {
    console.error('Error generating next invoice number:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to generate invoice number.'
    })
  }
}

// Create New Bill with Line Items
export async function createBill(req, res) {
  try {
    const {
      invoice_number,
      invoice_date,
      invoice_type = 'NON_GST',
      copy_type = 'ORIGINAL',
      customer_name,
      customer_phone,
      customer_email,
      customer_address,
      customer_gstin,
      place_of_supply = '33-Tamil Nadu',
      taxable_amount = 0,
      cgst_rate = 9.00,
      cgst_amount = 0,
      sgst_rate = 9.00,
      sgst_amount = 0,
      igst_rate = 18.00,
      igst_amount = 0,
      total_tax = 0,
      round_off = 0,
      total_amount = 0,
      amount_in_words = '',
      payment_mode = 'Cash',
      payment_status = 'Paid',
      notes = '',
      items = []
    } = req.body

    if (!invoice_number || !invoice_number.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Invoice Number is required.'
      })
    }

    if (!customer_name || !customer_name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Customer Name is required.'
      })
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one line item is required to create a bill.'
      })
    }

    const pool = getPool()

    // Check duplicate invoice number
    const [existing] = await pool.query('SELECT id FROM bills WHERE invoice_number = ?', [invoice_number.trim()])
    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Invoice number "${invoice_number}" already exists. Please choose a different number.`
      })
    }

    // Insert into bills table
    const [billResult] = await pool.query(`
      INSERT INTO bills (
        invoice_number, invoice_date, invoice_type, copy_type,
        customer_name, customer_phone, customer_email, customer_address, customer_gstin,
        place_of_supply, taxable_amount, cgst_rate, cgst_amount,
        sgst_rate, sgst_amount, igst_rate, igst_amount,
        total_tax, round_off, total_amount, amount_in_words,
        payment_mode, payment_status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      invoice_number.trim(),
      invoice_date || new Date().toISOString().split('T')[0],
      invoice_type,
      copy_type,
      customer_name.trim(),
      customer_phone ? customer_phone.trim() : null,
      customer_email ? customer_email.trim() : null,
      customer_address ? customer_address.trim() : null,
      customer_gstin ? customer_gstin.trim() : null,
      place_of_supply || '33-Tamil Nadu',
      parseFloat(taxable_amount) || 0,
      parseFloat(cgst_rate) || 0,
      parseFloat(cgst_amount) || 0,
      parseFloat(sgst_rate) || 0,
      parseFloat(sgst_amount) || 0,
      parseFloat(igst_rate) || 0,
      parseFloat(igst_amount) || 0,
      parseFloat(total_tax) || 0,
      parseFloat(round_off) || 0,
      parseFloat(total_amount) || 0,
      amount_in_words || '',
      payment_mode || 'Cash',
      payment_status || 'Paid',
      notes || ''
    ])

    const billId = billResult.insertId

    // Insert Bill Items
    for (const item of items) {
      await pool.query(`
        INSERT INTO bill_items (
          bill_id, material_id, item_name, serial_number,
          hsn_code, quantity, unit, rate, tax_rate, tax_amount, amount
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        billId,
        item.material_id ? parseInt(item.material_id, 10) : null,
        item.item_name || item.name || 'Item',
        item.serial_number ? item.serial_number.trim() : null,
        item.hsn_code ? item.hsn_code.trim() : null,
        parseFloat(item.quantity) || 1,
        item.unit || 'NOS',
        parseFloat(item.rate) || 0,
        parseFloat(item.tax_rate) || 18.00,
        parseFloat(item.tax_amount) || 0,
        parseFloat(item.amount) || 0
      ])
    }

    // Trigger Automated Email Dispatch in Background if configured
    (async () => {
      try {
        const [configRows] = await pool.query('SELECT auto_email_on_create, smtp_user, smtp_pass FROM email_configs WHERE id = 1')
        if (configRows.length > 0 && configRows[0].auto_email_on_create && configRows[0].smtp_user && configRows[0].smtp_pass) {
          console.log(`📤 Auto-dispatching invoice PDF email for bill #${invoice_number}...`)
          await sendInvoiceEmail(billId)
        }
      } catch (e) {
        console.error('Auto-email background dispatch error:', e)
      }
    })()

    return res.status(201).json({
      success: true,
      message: 'Bill created successfully!',
      billId,
      invoiceNumber: invoice_number
    })
  } catch (error) {
    console.error('Error creating bill:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to create bill in database.'
    })
  }
}

// Get All Bills with line items and statistics
export async function getAllBills(req, res) {
  try {
    const pool = getPool()
    
    // Fetch all bills chronologically latest first
    const [bills] = await pool.query(`
      SELECT 
        b.*,
        COUNT(bi.id) AS total_items
      FROM bills b
      LEFT JOIN bill_items bi ON b.id = bi.bill_id
      GROUP BY b.id
      ORDER BY b.id DESC
    `)

    // Fetch all line items for exported bills
    const [allItems] = await pool.query(`
      SELECT * FROM bill_items ORDER BY id ASC
    `)

    const itemsByBillId = {}
    allItems.forEach(item => {
      if (!itemsByBillId[item.bill_id]) {
        itemsByBillId[item.bill_id] = []
      }
      itemsByBillId[item.bill_id].push(item)
    })

    const billsWithItems = bills.map(bill => ({
      ...bill,
      items: itemsByBillId[bill.id] || []
    }))

    // Overall summary metrics
    const totalRevenue = bills.reduce((acc, b) => acc + (parseFloat(b.total_amount) || 0), 0)
    const paidCount = bills.filter(b => b.payment_status === 'Paid').length
    const pendingCount = bills.filter(b => b.payment_status === 'Pending').length

    return res.status(200).json({
      success: true,
      count: billsWithItems.length,
      bills: billsWithItems,
      stats: {
        totalBills: bills.length,
        totalRevenue,
        paidCount,
        pendingCount
      }
    })
  } catch (error) {
    console.error('Error fetching bills:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve bills.'
    })
  }
}

// Get Single Bill with its line items
export async function getBillById(req, res) {
  try {
    const { id } = req.params
    const pool = getPool()

    const [bills] = await pool.query('SELECT * FROM bills WHERE id = ?', [id])
    if (bills.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found.'
      })
    }

    const [items] = await pool.query('SELECT * FROM bill_items WHERE bill_id = ? ORDER BY id ASC', [id])

    return res.status(200).json({
      success: true,
      bill: {
        ...bills[0],
        items
      }
    })
  } catch (error) {
    console.error('Error fetching bill details:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch bill details.'
    })
  }
}

// Delete Bill
export async function deleteBill(req, res) {
  try {
    const { id } = req.params
    const pool = getPool()

    const [result] = await pool.query('DELETE FROM bills WHERE id = ?', [id])

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found.'
      })
    }

    return res.status(200).json({
      success: true,
      message: 'Bill deleted successfully.'
    })
  } catch (error) {
    console.error('Error deleting bill:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to delete bill.'
    })
  }
}
