import express from 'express'
import { login, getMe, updateProfile } from '../controllers/authController.js'

const router = express.Router()

router.post('/login', login)
router.get('/me', getMe)
router.put('/profile', updateProfile)

export default router

