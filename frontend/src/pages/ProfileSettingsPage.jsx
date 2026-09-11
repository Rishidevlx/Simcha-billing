import { useState, useEffect } from 'react'
import {
  User,
  Mail,
  Briefcase,
  Building2,
  Edit2,
  Check,
  Save,
  RotateCcw,
  X,
  CheckCircle2
} from 'lucide-react'
import Swal from 'sweetalert2'

import defaultPfp from '../assets/avatar/Deafult Pfp.jpg'
import maleAvatar from '../assets/avatar/Male avatar.png'
import femaleAvatar from '../assets/avatar/Female Avatar.png'
import { API_ENDPOINTS } from '../config/api'

const AVATAR_OPTIONS = [
  { id: 'default', label: 'Default', src: defaultPfp },
  { id: 'male', label: 'Male', src: maleAvatar },
  { id: 'female', label: 'Female', src: femaleAvatar }
]


export default function ProfileSettingsPage({ user, onUpdateUser }) {
  const [isEditing, setIsEditing] = useState(false)
  
  const [name, setName] = useState(user?.name || 'Rishi')
  const [email, setEmail] = useState(user?.email || 'admin@simcha.com')
  const [designation, setDesignation] = useState(user?.role || 'Administrator')
  const [selectedAvatarId, setSelectedAvatarId] = useState(user?.avatar || 'male')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (user) {
      setName(user.name || 'Rishi')
      setEmail(user.email || 'admin@simcha.com')
      setDesignation(user.role || 'Administrator')
      setSelectedAvatarId(user.avatar || 'male')
    }
  }, [user])

  // Get current active avatar image source
  const currentAvatar = AVATAR_OPTIONS.find(a => a.id === selectedAvatarId)?.src || maleAvatar

  const handleReset = () => {
    setName(user?.name || 'Rishi')
    setEmail(user?.email || 'admin@simcha.com')
    setDesignation(user?.role || 'Administrator')
    setSelectedAvatarId(user?.avatar || 'male')
  }

  const handleCancel = () => {
    handleReset()
    setIsEditing(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!name.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Required Field',
        text: 'Please enter your User Name.',
        confirmButtonColor: '#043486'
      })
      return
    }

    if (!email.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Required Field',
        text: 'Please enter your Email Address.',
        confirmButtonColor: '#043486'
      })
      return
    }

    setIsSaving(true)
    try {
      const token = localStorage.getItem('simcha_token') || sessionStorage.getItem('simcha_token')
      const res = await fetch(API_ENDPOINTS.PROFILE, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          designation: designation.trim(),
          avatar: selectedAvatarId
        })
      })


      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to update profile.')
      }

      const updatedUser = {
        ...user,
        name: data.user.name,
        email: data.user.email,
        role: data.user.role,
        avatar: selectedAvatarId
      }

      // Update parent app state
      if (onUpdateUser) {
        onUpdateUser(updatedUser)
      }

      // Update local storage / session storage
      if (localStorage.getItem('simcha_user')) {
        localStorage.setItem('simcha_user', JSON.stringify(updatedUser))
      }
      if (sessionStorage.getItem('simcha_user')) {
        sessionStorage.setItem('simcha_user', JSON.stringify(updatedUser))
      }

      setIsEditing(false)

      Swal.fire({
        icon: 'success',
        title: 'Profile Updated!',
        text: 'Your profile details have been saved successfully.',
        timer: 2000,
        showConfirmButton: false
      })
    } catch (err) {
      console.error('Profile update error:', err)
      Swal.fire({
        icon: 'error',
        title: 'Update Failed',
        text: err.message || 'Unable to update profile.',
        confirmButtonColor: '#043486'
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Top Breadcrumb & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-200/80 dark:border-slate-800 pb-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#292424] dark:text-white uppercase flex items-center gap-2">
            <User className="text-[#043486] dark:text-blue-400" size={22} />
            PROFILE SETTINGS
          </h1>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
            Manage your account details, email address and designation
          </p>
        </div>
        <div className="flex items-center text-xs text-gray-500 dark:text-slate-400 gap-1.5 font-medium">
          <span>Settings</span>
          <span>›</span>
          <span className="text-[#043486] dark:text-blue-400 font-semibold">Profile Settings</span>
        </div>
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: User Summary & Avatar Selector Card (Boxy) */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-sm shadow-xs transition-colors p-5 space-y-5">
          
          {/* Main Selected Avatar Preview */}
          <div className="text-center pb-4 border-b border-gray-100 dark:border-slate-800">
            <div className="relative inline-block">
              <div className="w-24 h-24 rounded-full overflow-hidden border-3 border-[#043486]/20 dark:border-blue-500/40 shadow-md mx-auto bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <img
                  src={currentAvatar}
                  alt={name}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <h3 className="text-base font-bold text-[#292424] dark:text-white mt-3.5">
              {name || 'User Name'}
            </h3>
            <p className="text-xs text-gray-500 dark:text-slate-400 font-medium mt-0.5">
              {designation || 'Administrator'}
            </p>
          </div>

          {/* 3 Avatar Selection Options (Interactive only when isEditing is true) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <label className="text-[11px] font-bold text-gray-600 dark:text-slate-300 uppercase tracking-wider">
                Choose Avatar
              </label>
              {!isEditing && (
                <span className="text-[10px] text-gray-400 dark:text-slate-500 font-medium">
                  (Locked)
                </span>
              )}
            </div>
            
            <div className={`flex items-center justify-center gap-4 pt-1 ${!isEditing ? 'opacity-60 pointer-events-none' : ''}`}>
              {AVATAR_OPTIONS.map((avatar) => {
                const isSelected = selectedAvatarId === avatar.id
                return (
                  <button
                    key={avatar.id}
                    type="button"
                    disabled={!isEditing}
                    onClick={() => isEditing && setSelectedAvatarId(avatar.id)}
                    className={`relative group p-1 rounded-full transition-all ${
                      isEditing ? 'cursor-pointer hover:scale-105' : 'cursor-not-allowed'
                    } ${
                      isSelected
                        ? 'ring-3 ring-[#043486] dark:ring-blue-500 scale-105 shadow-md'
                        : 'opacity-70 hover:opacity-100 border border-gray-200 dark:border-slate-700'
                    }`}
                    title={isEditing ? `Select ${avatar.label} Avatar` : 'Click Edit Profile to change avatar'}
                  >
                    <div className="w-13 h-13 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                      <img
                        src={avatar.src}
                        alt={avatar.label}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {isSelected && (
                      <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#043486] text-white flex items-center justify-center shadow-xs border-2 border-white dark:border-slate-900">
                        <Check size={11} strokeWidth={3} />
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>


          {/* User Info Details List */}
          <div className="space-y-3 pt-3 border-t border-gray-100 dark:border-slate-800 text-xs">
            <div className="flex items-center justify-between py-1 border-b border-gray-100 dark:border-slate-800">
              <span className="text-gray-500 dark:text-slate-400 flex items-center gap-2">
                <User size={14} className="text-[#043486] dark:text-blue-400" />
                User Name:
              </span>
              <span className="font-semibold text-[#292424] dark:text-white">{name}</span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-gray-100 dark:border-slate-800">
              <span className="text-gray-500 dark:text-slate-400 flex items-center gap-2">
                <Mail size={14} className="text-[#043486] dark:text-blue-400" />
                Email:
              </span>
              <span className="font-semibold text-[#292424] dark:text-white">{email}</span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-gray-100 dark:border-slate-800">
              <span className="text-gray-500 dark:text-slate-400 flex items-center gap-2">
                <Briefcase size={14} className="text-[#043486] dark:text-blue-400" />
                Designation:
              </span>
              <span className="font-semibold text-[#292424] dark:text-white">{designation}</span>
            </div>

            <div className="flex items-center justify-between py-1">
              <span className="text-gray-500 dark:text-slate-400 flex items-center gap-2">
                <Building2 size={14} className="text-[#043486] dark:text-blue-400" />
                Company:
              </span>
              <span className="font-semibold text-[#292424] dark:text-white">Simcha Info Solutions</span>
            </div>
          </div>

        </div>

        {/* Right Column: Profile Settings Form (Velzon Tabbed Style with Edit Mode Toggle) */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-sm shadow-xs transition-colors">
          
          {/* Tab Header & Edit Button */}
          <div className="border-b border-gray-200 dark:border-slate-800 px-6 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#043486] dark:text-blue-400 border-b-2 border-[#043486] dark:border-blue-400 pb-2.5 flex items-center gap-2">
                <User size={15} />
                <span>Personal Details</span>
              </span>
            </div>

            {/* Edit / Cancel Toggle Button */}
            {!isEditing ? (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-[#043486] hover:bg-[#0248BC] dark:bg-blue-600 dark:hover:bg-blue-500 rounded-sm transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Edit2 size={13} />
                <span>Edit Profile</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCancel}
                className="px-3.5 py-1.5 text-xs font-semibold text-gray-600 dark:text-slate-300 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700 rounded-sm transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <X size={14} />
                <span>Cancel</span>
              </button>
            )}
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* Field 1: User Name */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-200 mb-1.5 uppercase tracking-wide">
                  User Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User size={16} className={`absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none ${isEditing ? 'text-[#043486] dark:text-blue-400' : 'text-gray-400 dark:text-slate-500'}`} />
                  <input
                    type="text"
                    required
                    disabled={!isEditing}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    className={`w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-sm transition-all font-medium ${
                      isEditing
                        ? 'text-[#292424] dark:text-white bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 focus:outline-none focus:border-[#043486] dark:focus:border-blue-500 ring-1 ring-[#043486]/10'
                        : 'text-gray-600 dark:text-slate-400 bg-gray-50 dark:bg-slate-950/60 border border-gray-200 dark:border-slate-800 cursor-not-allowed select-none'
                    }`}
                  />
                </div>
              </div>

              {/* Field 2: User Email */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-200 mb-1.5 uppercase tracking-wide">
                  User Email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail size={16} className={`absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none ${isEditing ? 'text-[#043486] dark:text-blue-400' : 'text-gray-400 dark:text-slate-500'}`} />
                  <input
                    type="email"
                    required
                    disabled={!isEditing}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. admin@simcha.com"
                    className={`w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-sm transition-all font-medium ${
                      isEditing
                        ? 'text-[#292424] dark:text-white bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 focus:outline-none focus:border-[#043486] dark:focus:border-blue-500 ring-1 ring-[#043486]/10'
                        : 'text-gray-600 dark:text-slate-400 bg-gray-50 dark:bg-slate-950/60 border border-gray-200 dark:border-slate-800 cursor-not-allowed select-none'
                    }`}
                  />
                </div>
              </div>

              {/* Field 3: Designation */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-200 mb-1.5 uppercase tracking-wide">
                  Designation <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Briefcase size={16} className={`absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none ${isEditing ? 'text-[#043486] dark:text-blue-400' : 'text-gray-400 dark:text-slate-500'}`} />
                  <input
                    type="text"
                    required
                    disabled={!isEditing}
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    placeholder="e.g. Administrator, Billing Manager, Owner"
                    className={`w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-sm transition-all font-medium ${
                      isEditing
                        ? 'text-[#292424] dark:text-white bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 focus:outline-none focus:border-[#043486] dark:focus:border-blue-500 ring-1 ring-[#043486]/10'
                        : 'text-gray-600 dark:text-slate-400 bg-gray-50 dark:bg-slate-950/60 border border-gray-200 dark:border-slate-800 cursor-not-allowed select-none'
                    }`}
                  />
                </div>
              </div>

            </div>

            {/* Action Buttons (Visible Only In Edit Mode) */}
            {isEditing && (
              <div className="pt-4 border-t border-gray-100 dark:border-slate-800 flex items-center justify-end gap-3 animate-in fade-in duration-150">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-slate-300 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-sm hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <RotateCcw size={13} />
                  <span>Reset</span>
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 text-xs font-bold text-white bg-[#043486] hover:bg-[#0248BC] dark:bg-blue-600 dark:hover:bg-blue-500 border border-[#043486] dark:border-blue-600 rounded-sm shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  <Save size={14} />
                  <span>{isSaving ? 'Updating...' : 'Update Profile'}</span>
                </button>
              </div>
            )}

          </form>

        </div>

      </div>

    </div>
  )
}
