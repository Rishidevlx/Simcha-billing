import { getPool } from '../config/db.js'

// Get System Settings (Company info, Bank details, Terms, Tax rates)
export async function getSettings(req, res) {
  try {
    const pool = getPool()
    const [rows] = await pool.query('SELECT * FROM settings WHERE id = 1 LIMIT 1')

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Settings not configured yet.'
      })
    }

    const settings = rows[0]
    
    // Parse terms_conditions if it's JSON or string
    let parsedTerms = []
    if (typeof settings.terms_conditions === 'string') {
      try {
        parsedTerms = JSON.parse(settings.terms_conditions)
      } catch (e) {
        parsedTerms = settings.terms_conditions.split('\n').filter(Boolean)
      }
    } else if (Array.isArray(settings.terms_conditions)) {
      parsedTerms = settings.terms_conditions
    }

    return res.status(200).json({
      success: true,
      settings: {
        ...settings,
        terms_conditions: parsedTerms
      }
    })
  } catch (error) {
    console.error('Error fetching settings:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch settings from database.'
    })
  }
}

// Update System Settings
export async function updateSettings(req, res) {
  try {
    const {
      company_name,
      address,
      phone,
      email,
      gstin,
      bank_name,
      account_name,
      account_no,
      ifsc_code,
      branch,
      bank_image_url,
      terms_conditions,
      cgst_rate,
      sgst_rate,
      igst_rate,
      invoice_prefix
    } = req.body

    const pool = getPool()

    const formattedTerms = Array.isArray(terms_conditions) 
      ? JSON.stringify(terms_conditions) 
      : (typeof terms_conditions === 'string' ? terms_conditions : '[]')

    await pool.query(`
      INSERT INTO settings (
        id, company_name, address, phone, email, gstin,
        bank_name, account_name, account_no, ifsc_code, branch, bank_image_url,
        terms_conditions, cgst_rate, sgst_rate, igst_rate, invoice_prefix
      ) VALUES (
        1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      )
      ON DUPLICATE KEY UPDATE
        company_name = VALUES(company_name),
        address = VALUES(address),
        phone = VALUES(phone),
        email = VALUES(email),
        gstin = VALUES(gstin),
        bank_name = VALUES(bank_name),
        account_name = VALUES(account_name),
        account_no = VALUES(account_no),
        ifsc_code = VALUES(ifsc_code),
        branch = VALUES(branch),
        bank_image_url = VALUES(bank_image_url),
        terms_conditions = VALUES(terms_conditions),
        cgst_rate = VALUES(cgst_rate),
        sgst_rate = VALUES(sgst_rate),
        igst_rate = VALUES(igst_rate),
        invoice_prefix = VALUES(invoice_prefix),
        updated_at = CURRENT_TIMESTAMP
    `, [
      company_name || 'SIMCHA INFO SOLUTIONS',
      address || '',
      phone || '',
      email || '',
      gstin || '',
      bank_name || '',
      account_name || '',
      account_no || '',
      ifsc_code || '',
      branch || '',
      bank_image_url || null,
      formattedTerms,
      parseFloat(cgst_rate) || 9.00,
      parseFloat(sgst_rate) || 9.00,
      parseFloat(igst_rate) || 18.00,
      invoice_prefix || 'INV-'
    ])

    return res.status(200).json({
      success: true,
      message: 'System settings updated successfully!'
    })
  } catch (error) {
    console.error('Error updating settings:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to update settings.'
    })
  }
}
