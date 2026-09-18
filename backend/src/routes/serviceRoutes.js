import express from 'express'
import {
  getNextServiceNumber,
  createServiceBill,
  getServiceBills,
  getServiceBillById,
  updateServiceStatus,
  deleteServiceBill,
  sendServiceReceiptEmail
} from '../controllers/serviceController.js'

const router = express.Router()

router.get('/next-number', getNextServiceNumber)
router.post('/', createServiceBill)
router.get('/', getServiceBills)
router.get('/:id', getServiceBillById)
router.patch('/:id/status', updateServiceStatus)
router.delete('/:id', deleteServiceBill)
router.post('/:id/send-receipt', sendServiceReceiptEmail)

export default router
