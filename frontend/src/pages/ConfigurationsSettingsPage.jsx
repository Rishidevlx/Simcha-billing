import React, { useState, useEffect } from 'react'
import {
  SlidersHorizontal,
  Mail,
  Send,
  Save,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Key,
  Server,
  AtSign,
  User,
  Info,
  Edit2,
  X
} from 'lucide-react'
import Swal from 'sweetalert2'
import { API_ENDPOINTS } from '../config/api'

export default function ConfigurationsSettingsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSavingSmtp, setIsSavingSmtp] = useState(false)
  const [isSavingRecipient, setIsSavingRecipient] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // Edit Mode States
  const [isEditingSmtp, setIsEditingSmtp] = useState(false)
  const [isEditingRecipient, setIsEditingRecipient] = useState(false)

  // Form Data & Original Data for Cancel/Revert
  const [formData, setFormData] = useState({
    smtp_host: 'smtp.gmail.com',
    smtp_port: 465,
    smtp_secure: true,
    smtp_user: '',
    smtp_pass: '',
    sender_name: 'SIMCHA INFO SOLUTIONS',
    recipient_email: '',
    auto_email_on_create: true,
    email_subject: 'New Tax Invoice Generated - {invoice_number}',
    email_body: 'Dear Customer / Team,\n\nPlease find attached the official Tax Invoice generated from Simcha Info Solutions Billing System.\n\nThank you for doing business with us!'
  })

  const [originalData, setOriginalData] = useState({ ...formData })

  // Fetch current configs on mount
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setIsLoading(true)
        const res = await fetch(API_ENDPOINTS.EMAIL_CONFIG)
        const data = await res.json()
        if (data.success && data.config) {
          const loaded = {
            smtp_host: data.config.smtp_host || 'smtp.gmail.com',
            smtp_port: data.config.smtp_port || 465,
            smtp_secure: Boolean(data.config.smtp_secure),
            smtp_user: data.config.smtp_user || '',
            smtp_pass: data.config.smtp_pass || '',
            sender_name: data.config.sender_name || 'SIMCHA INFO SOLUTIONS',
            recipient_email: data.config.recipient_email || data.config.smtp_user || '',
            auto_email_on_create: data.config.auto_email_on_create !== undefined ? Boolean(data.config.auto_email_on_create) : true,
            email_subject: data.config.email_subject || 'New Tax Invoice Generated - {invoice_number}',
            email_body: data.config.email_body || ''
          }
          setFormData(loaded)
          setOriginalData(loaded)
        }
      } catch (err) {
        console.error('Failed to load email configurations:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchConfig()
  }, [])

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Toggle Auto-Dispatch directly and save
  const handleToggleAutoEmail = async (checked) => {
    const updated = { ...formData, auto_email_on_create: checked }
    setFormData(updated)
    try {
      await fetch(API_ENDPOINTS.EMAIL_CONFIG, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      })
      setOriginalData(updated)
      Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true
      }).fire({
        icon: 'success',
        title: checked ? 'Auto Email Dispatch Enabled' : 'Auto Email Dispatch Disabled'
      })
    } catch (err) {
      console.error('Failed to update toggle:', err)
    }
  }

  // Save SMTP Section
  const handleSaveSmtp = async (e) => {
    if (e) e.preventDefault()
    try {
      setIsSavingSmtp(true)
      const res = await fetch(API_ENDPOINTS.EMAIL_CONFIG, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      const data = await res.json()

      if (data.success) {
        setOriginalData({ ...formData })
        setIsEditingSmtp(false)
        Swal.fire({
          icon: 'success',
          title: 'SMTP Settings Saved',
          text: 'Outgoing SMTP server configurations updated successfully.',
          confirmButtonColor: '#043486',
          timer: 2000,
          showConfirmButton: false
        })
      } else {
        throw new Error(data.message || 'Failed to save SMTP settings.')
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Save Failed',
        text: err.message,
        confirmButtonColor: '#043486'
      })
    } finally {
      setIsSavingSmtp(false)
    }
  }

  // Cancel SMTP Edit
  const handleCancelSmtp = () => {
    setFormData(prev => ({
      ...prev,
      smtp_host: originalData.smtp_host,
      smtp_port: originalData.smtp_port,
      smtp_secure: originalData.smtp_secure,
      smtp_user: originalData.smtp_user,
      smtp_pass: originalData.smtp_pass,
      sender_name: originalData.sender_name,
      recipient_email: originalData.recipient_email
    }))
    setIsEditingSmtp(false)
  }

  // Save Recipient Section
  const handleSaveRecipient = async (e) => {
    if (e) e.preventDefault()
    try {
      setIsSavingRecipient(true)
      const res = await fetch(API_ENDPOINTS.EMAIL_CONFIG, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      const data = await res.json()

      if (data.success) {
        setOriginalData({ ...formData })
        setIsEditingRecipient(false)
        Swal.fire({
          icon: 'success',
          title: 'Email Templates Saved',
          text: 'Email Subject and Message Template updated successfully.',
          confirmButtonColor: '#043486',
          timer: 2000,
          showConfirmButton: false
        })
      } else {
        throw new Error(data.message || 'Failed to save recipient settings.')
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Save Failed',
        text: err.message,
        confirmButtonColor: '#043486'
      })
    } finally {
      setIsSavingRecipient(false)
    }
  }

  // Cancel Recipient Edit
  const handleCancelRecipient = () => {
    setFormData(prev => ({
      ...prev,
      recipient_email: originalData.recipient_email,
      email_subject: originalData.email_subject,
      email_body: originalData.email_body
    }))
    setIsEditingRecipient(false)
  }

  // Test SMTP Connection
  const handleTestEmail = async () => {
    if (!formData.smtp_user || !formData.smtp_pass) {
      Swal.fire({
        icon: 'warning',
        title: 'Credentials Required',
        text: 'Please enter your Sender Email ID and App Password before testing.',
        confirmButtonColor: '#043486'
      })
      return
    }

    try {
      setIsTesting(true)
      const res = await fetch(API_ENDPOINTS.EMAIL_TEST, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      const data = await res.json()

      if (data.success) {
        Swal.fire({
          icon: 'success',
          title: 'SMTP Connected & Test Email Sent!',
          text: `Verification email dispatched to ${formData.recipient_email || formData.smtp_user}. Check your inbox!`,
          confirmButtonColor: '#043486'
        })
      } else {
        throw new Error(data.message || 'SMTP Authentication failed.')
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'SMTP Test Failed',
        html: `<div style="text-align: left; font-size: 13px;">
          <p><strong>Error:</strong> ${err.message}</p>
          <hr style="margin: 10px 0; border: 0; border-top: 1px solid #e2e8f0;"/>
          <p><strong>Common Fixes for Gmail:</strong></p>
          <ul style="padding-left: 20px; line-height: 1.5;">
            <li>Use a 16-character <strong>Google App Password</strong> (not your normal Gmail password).</li>
            <li>Ensure 2-Step Verification is turned ON in your Google Account.</li>
            <li>SMTP Port should be <strong>465</strong> (SSL) or <strong>587</strong> (TLS).</li>
          </ul>
        </div>`,
        confirmButtonColor: '#043486'
      })
    } finally {
      setIsTesting(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16 font-['Poppins',sans-serif]">
      
      {/* 1. Header Banner */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-none border border-gray-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="p-2 bg-blue-50 dark:bg-blue-950/60 text-[#043486] dark:text-blue-400 border border-blue-200 dark:border-blue-900">
              <SlidersHorizontal size={18} />
            </div>
            <h1 className="text-xl font-bold text-[#292424] dark:text-white uppercase tracking-wide">
              Configurations Settings
            </h1>
            <span className="px-2.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold uppercase tracking-wider">
              Live Module
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-slate-400">
            Configure SMTP credentials to automatically generate &amp; email PDF invoices upon bill creation (CTRL+Enter / Save).
          </p>
        </div>

        <div>
          <button
            type="button"
            onClick={handleTestEmail}
            disabled={isTesting}
            className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 text-[#043486] dark:text-blue-400 font-bold text-xs rounded-none border border-gray-300 dark:border-slate-700 shadow-xs transition-all cursor-pointer disabled:opacity-50"
          >
            {isTesting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-[#043486] dark:border-blue-400 border-t-transparent rounded-full animate-spin" />
                <span>Testing SMTP...</span>
              </>
            ) : (
              <>
                <Send size={14} />
                <span>SEND TEST EMAIL</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. Automated Trigger Status & Switch (Clean Standard Rounded Pill Toggle) */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-none border border-gray-200 dark:border-slate-800 shadow-xs transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 bg-blue-50 dark:bg-blue-950 text-[#043486] dark:text-blue-400 border border-blue-200 dark:border-blue-900 shrink-0">
              <Mail size={22} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#292424] dark:text-white">
                Auto-Dispatch Invoice PDF on Bill Generation
              </h3>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 max-w-xl">
                When enabled, whenever a bill is generated (via <strong>"Save &amp; Generate Invoice"</strong> or shortcut <strong>CTRL + ENTER</strong>), the system will automatically create the invoice PDF and send it to the configured recipient email address.
              </p>
            </div>
          </div>

          {/* Standard Smooth Rounded Pill Toggle */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleToggleAutoEmail(!formData.auto_email_on_create)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                formData.auto_email_on_create ? 'bg-[#043486]' : 'bg-gray-300 dark:bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  formData.auto_email_on_create ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
            <span className="text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wide min-w-[65px]">
              {formData.auto_email_on_create ? 'Enabled' : 'Disabled'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. SMTP Server & Recipient Forms */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left 7 Columns: SMTP Host & Credentials */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 rounded-none border border-gray-200 dark:border-slate-800 shadow-xs space-y-5 transition-colors">
          
          {/* Section Header with Edit & Save / Cancel Buttons */}
          <div className="border-b border-gray-100 dark:border-slate-800 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-[#292424] dark:text-white flex items-center gap-2 uppercase tracking-wide">
                <Server size={16} className="text-[#043486] dark:text-blue-400" />
                <span>SMTP Mail Server Settings</span>
              </h2>
              <p className="text-xs text-gray-400 dark:text-slate-400 mt-0.5">
                Configure outgoing sender email, app password &amp; destination recipient
              </p>
            </div>

            <div className="flex items-center gap-2">
              {!isEditingSmtp ? (
                <button
                  type="button"
                  onClick={() => setIsEditingSmtp(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#043486] dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-900 rounded-none transition-colors cursor-pointer"
                >
                  <Edit2 size={13} />
                  <span>Edit</span>
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleCancelSmtp}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-gray-600 dark:text-slate-300 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 border border-gray-300 dark:border-slate-700 rounded-none transition-colors cursor-pointer"
                  >
                    <X size={13} />
                    <span>Cancel</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveSmtp}
                    disabled={isSavingSmtp}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-[#043486] hover:bg-[#0248BC] rounded-none shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Save size={13} />
                    <span>{isSavingSmtp ? 'Saving...' : 'Save'}</span>
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="space-y-4">
            
            {/* Field 1: Sender Email ID (From Email) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-200">
                  Sender Email ID (From Mail / SMTP User) <span className="text-red-500">*</span>
                </label>
                <span className="text-[11px] text-gray-500 dark:text-slate-400">
                  Endha Mail-la irundhu send aaganum
                </span>
              </div>
              <input
                type="email"
                disabled={!isEditingSmtp}
                value={formData.smtp_user}
                onChange={(e) => handleChange('smtp_user', e.target.value)}
                placeholder="simchainfosolutions@gmail.com"
                required
                className="w-full px-3.5 py-2.5 text-xs text-[#292424] dark:text-white bg-white dark:bg-slate-950 disabled:bg-gray-50 dark:disabled:bg-slate-900/80 disabled:text-gray-500 dark:disabled:text-slate-400 border border-gray-300 dark:border-slate-700 rounded-none focus:outline-none focus:border-[#043486] font-mono disabled:cursor-not-allowed"
              />
            </div>

            {/* Field 2: Email App Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-200">
                  Email App Password / SMTP Password <span className="text-red-500">*</span>
                </label>
                <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">
                  16-Digit Google App Password
                </span>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  disabled={!isEditingSmtp}
                  value={formData.smtp_pass}
                  onChange={(e) => handleChange('smtp_pass', e.target.value)}
                  placeholder="xxxx xxxx xxxx xxxx"
                  required
                  className="w-full pl-3.5 pr-10 py-2.5 text-xs text-[#292424] dark:text-white bg-white dark:bg-slate-950 disabled:bg-gray-50 dark:disabled:bg-slate-900/80 disabled:text-gray-500 dark:disabled:text-slate-400 border border-gray-300 dark:border-slate-700 rounded-none focus:outline-none focus:border-[#043486] font-mono disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Field 3: Recipient Email (To Email - Where bill PDF should be delivered) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-200">
                  Send Invoice Copy To (Recipient Email) <span className="text-red-500">*</span>
                </label>
                <span className="text-[11px] text-gray-500 dark:text-slate-400">
                  Yaarukku bill copy deliver aaganum
                </span>
              </div>
              <input
                type="email"
                disabled={!isEditingSmtp}
                value={formData.recipient_email}
                onChange={(e) => handleChange('recipient_email', e.target.value)}
                placeholder="accountant@gmail.com / simchainfosolutions@gmail.com"
                required
                className="w-full px-3.5 py-2.5 text-xs text-[#292424] dark:text-white bg-white dark:bg-slate-950 disabled:bg-gray-50 dark:disabled:bg-slate-900/80 disabled:text-gray-500 dark:disabled:text-slate-400 border border-gray-300 dark:border-slate-700 rounded-none focus:outline-none focus:border-[#043486] font-mono disabled:cursor-not-allowed"
              />
            </div>

            {/* Field 4: Sender Display Name */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                Sender Display Name (From Name)
              </label>
              <input
                type="text"
                disabled={!isEditingSmtp}
                value={formData.sender_name}
                onChange={(e) => handleChange('sender_name', e.target.value)}
                placeholder="SIMCHA INFO SOLUTIONS"
                className="w-full px-3.5 py-2 text-xs text-[#292424] dark:text-white bg-white dark:bg-slate-950 disabled:bg-gray-50 dark:disabled:bg-slate-900/80 disabled:text-gray-500 dark:disabled:text-slate-400 border border-gray-300 dark:border-slate-700 rounded-none focus:outline-none focus:border-[#043486] disabled:cursor-not-allowed"
              />
            </div>

            {/* Advanced Host & Port Settings */}
            <div className="pt-2 border-t border-gray-100 dark:border-slate-800">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Host */}
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 dark:text-slate-400 mb-1">
                    SMTP Host Server
                  </label>
                  <input
                    type="text"
                    disabled={!isEditingSmtp}
                    value={formData.smtp_host}
                    onChange={(e) => handleChange('smtp_host', e.target.value)}
                    placeholder="smtp.gmail.com"
                    className="w-full px-3 py-1.5 text-xs text-[#292424] dark:text-white bg-white dark:bg-slate-950 disabled:bg-gray-50 dark:disabled:bg-slate-900/80 disabled:text-gray-500 dark:disabled:text-slate-400 border border-gray-300 dark:border-slate-700 rounded-none focus:outline-none focus:border-[#043486] font-mono disabled:cursor-not-allowed"
                  />
                </div>

                {/* Port & Secure */}
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 dark:text-slate-400 mb-1">
                    SMTP Port &amp; Protocol
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      disabled={!isEditingSmtp}
                      value={formData.smtp_port}
                      onChange={(e) => handleChange('smtp_port', Number(e.target.value))}
                      placeholder="465"
                      className="w-20 px-2.5 py-1.5 text-xs text-[#292424] dark:text-white bg-white dark:bg-slate-950 disabled:bg-gray-50 dark:disabled:bg-slate-900/80 disabled:text-gray-500 dark:disabled:text-slate-400 border border-gray-300 dark:border-slate-700 rounded-none focus:outline-none focus:border-[#043486] font-mono disabled:cursor-not-allowed"
                    />
                    <select
                      disabled={!isEditingSmtp}
                      value={formData.smtp_secure ? 'SSL' : 'TLS'}
                      onChange={(e) => handleChange('smtp_secure', e.target.value === 'SSL')}
                      className="flex-1 px-2.5 py-1.5 text-xs font-semibold text-[#292424] dark:text-white bg-white dark:bg-slate-950 disabled:bg-gray-50 dark:disabled:bg-slate-900/80 disabled:text-gray-500 dark:disabled:text-slate-400 border border-gray-300 dark:border-slate-700 rounded-none focus:outline-none focus:border-[#043486] cursor-pointer disabled:cursor-not-allowed"
                    >
                      <option value="SSL">SSL (Port 465)</option>
                      <option value="TLS">STARTTLS (Port 587)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Gmail Instructions Note */}
          <div className="p-3.5 bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 text-xs text-blue-900 dark:text-blue-200 leading-relaxed flex items-start gap-2.5">
            <Info size={16} className="text-[#043486] dark:text-blue-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">How to generate Google App Password:</p>
              <p className="text-[11px] text-blue-800 dark:text-blue-300 mt-0.5">
                1. Open Google Account &rarr; Security &rarr; Turn on <strong>2-Step Verification</strong>.<br />
                2. Search for <strong>"App passwords"</strong> &rarr; Create app name "Simcha Billing".<br />
                3. Copy the 16-letter password and paste it in the field above.
              </p>
            </div>
          </div>

        </div>

        {/* Right 5 Columns: Email Subject & Message Body Templates */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-6 rounded-none border border-gray-200 dark:border-slate-800 shadow-xs space-y-4 transition-colors">
          
          {/* Section Header with Edit & Save / Cancel Buttons */}
          <div className="border-b border-gray-100 dark:border-slate-800 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-[#292424] dark:text-white flex items-center gap-2 uppercase tracking-wide">
                <AtSign size={16} className="text-[#043486] dark:text-blue-400" />
                <span>Email Message Templates</span>
              </h2>
              <p className="text-xs text-gray-400 dark:text-slate-400 mt-0.5">
                Customize the email subject and body format
              </p>
            </div>

            <div className="flex items-center gap-2">
              {!isEditingRecipient ? (
                <button
                  type="button"
                  onClick={() => setIsEditingRecipient(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#043486] dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-900 rounded-none transition-colors cursor-pointer"
                >
                  <Edit2 size={13} />
                  <span>Edit</span>
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleCancelRecipient}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-gray-600 dark:text-slate-300 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 border border-gray-300 dark:border-slate-700 rounded-none transition-colors cursor-pointer"
                  >
                    <X size={13} />
                    <span>Cancel</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveRecipient}
                    disabled={isSavingRecipient}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-[#043486] hover:bg-[#0248BC] rounded-none shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Save size={13} />
                    <span>{isSavingRecipient ? 'Saving...' : 'Save'}</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Email Subject Template */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
              Email Subject Template
            </label>
            <input
              type="text"
              disabled={!isEditingRecipient}
              value={formData.email_subject}
              onChange={(e) => handleChange('email_subject', e.target.value)}
              placeholder="New Tax Invoice Generated - {invoice_number}"
              className="w-full px-3.5 py-2 text-xs text-[#292424] dark:text-white bg-white dark:bg-slate-950 disabled:bg-gray-50 dark:disabled:bg-slate-900/80 disabled:text-gray-500 dark:disabled:text-slate-400 border border-gray-300 dark:border-slate-700 rounded-none focus:outline-none focus:border-[#043486] disabled:cursor-not-allowed"
            />
            <span className="text-[10px] text-gray-400 dark:text-slate-500 mt-1 block">
              Available tags: <code className="text-[#043486] dark:text-blue-400 font-mono">{'{invoice_number}'}</code>, <code className="text-[#043486] dark:text-blue-400 font-mono">{'{customer_name}'}</code>
            </span>
          </div>

          {/* Email Body Notes */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
              Message Body Template
            </label>
            <textarea
              rows={5}
              disabled={!isEditingRecipient}
              value={formData.email_body}
              onChange={(e) => handleChange('email_body', e.target.value)}
              placeholder="Message accompanying the invoice PDF..."
              className="w-full px-3.5 py-2 text-xs text-[#292424] dark:text-white bg-white dark:bg-slate-950 disabled:bg-gray-50 dark:disabled:bg-slate-900/80 disabled:text-gray-500 dark:disabled:text-slate-400 border border-gray-300 dark:border-slate-700 rounded-none focus:outline-none focus:border-[#043486] resize-none disabled:cursor-not-allowed"
            />
          </div>

          {/* Live Dispatch Preview */}
          <div className="p-3.5 bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 text-xs space-y-1.5">
            <p className="text-[11px] font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider">
              Dispatch Summary:
            </p>
            <div className="text-[11px] text-gray-600 dark:text-slate-400 space-y-1">
              <div><strong>From:</strong> {formData.smtp_user || '(Not configured)'}</div>
              <div><strong>To:</strong> {formData.recipient_email || formData.smtp_user || '(Not configured)'}</div>
              <div><strong>Attachment:</strong> <span className="font-mono text-[#043486] dark:text-blue-400 font-bold">Invoice_INV-XXXX-XX.pdf</span></div>
            </div>
          </div>

        </div>

      </div>

    </div>
  )
}
