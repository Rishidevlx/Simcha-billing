import { getPool } from '../config/db.js'

// Get all materials with joined Category Name (ordered chronologically ASC)
export const getMaterials = async (req, res) => {
  try {
    const pool = getPool()
    const [materials] = await pool.query(`
      SELECT 
        m.id,
        m.name,
        m.code,
        m.category_id,
        c.name AS category_name,
        m.brand,
        m.unit,
        m.description,
        m.selling_price,
        m.mrp,
        m.hsn_code,
        m.tax_inclusive,
        m.opening_stock,
        m.reorder_level,
        m.barcode,
        m.warranty,
        m.serial_tracking,
        m.status,
        m.created_at,
        m.updated_at
      FROM materials m
      LEFT JOIN categories c ON m.category_id = c.id
      ORDER BY m.id ASC
    `)

    res.status(200).json({
      success: true,
      count: materials.length,
      materials
    })
  } catch (error) {
    console.error('Error fetching materials:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve materials from database.'
    })
  }
}

// Get single material by ID
export const getMaterialById = async (req, res) => {
  try {
    const { id } = req.params
    const pool = getPool()
    const [materials] = await pool.query(`
      SELECT 
        m.*,
        c.name AS category_name
      FROM materials m
      LEFT JOIN categories c ON m.category_id = c.id
      WHERE m.id = ?
    `, [id])

    if (materials.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Material not found.'
      })
    }

    res.status(200).json({
      success: true,
      material: materials[0]
    })
  } catch (error) {
    console.error('Error fetching material by id:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve material.'
    })
  }
}

// Create new material
export const createMaterial = async (req, res) => {
  try {
    const {
      name,
      code,
      category_id,
      brand,
      unit = 'Nos',
      description,
      selling_price = 0,
      mrp = 0,
      hsn_code,
      tax_inclusive = false,
      opening_stock = 0,
      reorder_level = 0,
      barcode,
      warranty,
      serial_tracking = false,
      status = 'Active'
    } = req.body

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Material Name is required.'
      })
    }

    const pool = getPool()
    const [result] = await pool.query(`
      INSERT INTO materials (
        name, code, category_id, brand, unit, description, 
        selling_price, mrp, hsn_code, tax_inclusive, 
        opening_stock, reorder_level, barcode, warranty, 
        serial_tracking, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      name.trim(),
      code ? code.trim() : null,
      category_id ? parseInt(category_id, 10) : null,
      brand ? brand.trim() : null,
      unit || 'Nos',
      description ? description.trim() : null,
      parseFloat(selling_price) || 0,
      parseFloat(mrp) || 0,
      hsn_code ? hsn_code.trim() : null,
      Boolean(tax_inclusive),
      parseInt(opening_stock, 10) || 0,
      parseInt(reorder_level, 10) || 0,
      barcode ? barcode.trim() : null,
      warranty ? warranty.trim() : null,
      Boolean(serial_tracking),
      status === 'Inactive' ? 'Inactive' : 'Active'
    ])

    res.status(201).json({
      success: true,
      message: 'Material created successfully.',
      materialId: result.insertId
    })
  } catch (error) {
    console.error('Error creating material:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to create material.'
    })
  }
}

// Update existing material
export const updateMaterial = async (req, res) => {
  try {
    const { id } = req.params
    const {
      name,
      code,
      category_id,
      brand,
      unit = 'Nos',
      description,
      selling_price = 0,
      mrp = 0,
      hsn_code,
      tax_inclusive = false,
      opening_stock = 0,
      reorder_level = 0,
      barcode,
      warranty,
      serial_tracking = false,
      status = 'Active'
    } = req.body

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Material Name is required.'
      })
    }

    const pool = getPool()
    const [result] = await pool.query(`
      UPDATE materials SET
        name = ?,
        code = ?,
        category_id = ?,
        brand = ?,
        unit = ?,
        description = ?,
        selling_price = ?,
        mrp = ?,
        hsn_code = ?,
        tax_inclusive = ?,
        opening_stock = ?,
        reorder_level = ?,
        barcode = ?,
        warranty = ?,
        serial_tracking = ?,
        status = ?
      WHERE id = ?
    `, [
      name.trim(),
      code ? code.trim() : null,
      category_id ? parseInt(category_id, 10) : null,
      brand ? brand.trim() : null,
      unit || 'Nos',
      description ? description.trim() : null,
      parseFloat(selling_price) || 0,
      parseFloat(mrp) || 0,
      hsn_code ? hsn_code.trim() : null,
      Boolean(tax_inclusive),
      parseInt(opening_stock, 10) || 0,
      parseInt(reorder_level, 10) || 0,
      barcode ? barcode.trim() : null,
      warranty ? warranty.trim() : null,
      Boolean(serial_tracking),
      status === 'Inactive' ? 'Inactive' : 'Active',
      id
    ])

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Material not found.'
      })
    }

    res.status(200).json({
      success: true,
      message: 'Material updated successfully.'
    })
  } catch (error) {
    console.error('Error updating material:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update material.'
    })
  }
}

// Delete single material
export const deleteMaterial = async (req, res) => {
  try {
    const { id } = req.params
    const pool = getPool()
    const [result] = await pool.query('DELETE FROM materials WHERE id = ?', [id])

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Material not found.'
      })
    }

    res.status(200).json({
      success: true,
      message: 'Material deleted successfully.'
    })
  } catch (error) {
    console.error('Error deleting material:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to delete material.'
    })
  }
}

// Bulk delete materials
export const bulkDeleteMaterials = async (req, res) => {
  try {
    const { ids } = req.body

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No material IDs provided for deletion.'
      })
    }

    const pool = getPool()
    const [result] = await pool.query('DELETE FROM materials WHERE id IN (?)', [ids])

    res.status(200).json({
      success: true,
      message: `Successfully deleted ${result.affectedRows} materials.`,
      affectedRows: result.affectedRows
    })
  } catch (error) {
    console.error('Error bulk deleting materials:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to delete selected materials.'
    })
  }
}


