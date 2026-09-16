import express from 'express'
import {
  getNextInwardNumber,
  createInwardBill,
  getAllInwardBills,
  getInwardBillById,
  deleteInwardBill
} from '../controllers/inwardController.js'

const router = express.Router()

router.get('/meta/next-number', getNextInwardNumber)
router.post('/', createInwardBill)
router.get('/', getAllInwardBills)
router.get('/:id', getInwardBillById)
router.delete('/:id', deleteInwardBill)

export default router
