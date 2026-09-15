import express from 'express'
import {
  getNextInvoiceNumber,
  createBill,
  getAllBills,
  getBillById,
  deleteBill
} from '../controllers/billController.js'

const router = express.Router()

router.get('/', getAllBills)
router.post('/', createBill)
router.get('/meta/next-number', getNextInvoiceNumber)
router.get('/:id', getBillById)
router.delete('/:id', deleteBill)

export default router
