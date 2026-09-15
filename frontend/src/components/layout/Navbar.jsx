import { useState, useEffect } from 'react'
import {
  Menu,
  Maximize,
  Minimize,
  Moon,
  Sun,
  User,
  LogOut,
  Settings as SettingsIcon,
  ChevronDown
} from 'lucide-react'

import defaultPfp from '../../assets/avatar/Deafult Pfp.jpg'
import maleAvatar from '../../assets/avatar/Male avatar.png'
import femaleAvatar from '../../assets/avatar/Female Avatar.png'

const AVATAR_MAP = {
  default: defaultPfp,
  male: maleAvatar,
  female: femaleAvatar
}

export default function Navbar({
  isSidebarCollapsed,
  toggleSidebar,
  isDarkMode,
  toggleDarkMode,
  onLogout,
  user = { name: 'Rishi', role: 'Administrator', avatar: 'male' },
  setActiveRoute
}) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)

  const handleFullscreenToggle = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => console.error(err))
      setIsFullscreen(true)
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(err => console.error(err))
        setIsFullscreen(false)
      }
    }
  }

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', onFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange)
  }, [])

  const currentAvatarSrc = user.avatar ? (AVATAR_MAP[user.avatar] || AVATAR_MAP.male) : AVATAR_MAP.male

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 transition-colors duration-200">
      {/* Left: Sidebar Toggle Button */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg text-gray-500 dark:text-slate-400 hover:text-[#043486] dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors focus:outline-none cursor-pointer"
          aria-label="Toggle sidebar"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* Right: Actions (Fullscreen, Dark Mode, Profile) */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Fullscreen Button */}
        <button
          onClick={handleFullscreenToggle}
          title={isFullscreen ? "Exit Fullscreen" : "Toggle Fullscreen"}
          className="p-2.5 rounded-lg text-gray-500 dark:text-slate-400 hover:text-[#043486] dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors focus:outline-none cursor-pointer"
        >
          {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
        </button>

        {/* Dark / Light Mode Button */}
        <button
          onClick={toggleDarkMode}
          title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          className="p-2.5 rounded-lg text-gray-500 dark:text-slate-400 hover:text-[#043486] dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors focus:outline-none cursor-pointer"
        >
          {isDarkMode ? <Sun size={20} className="text-amber-400" /> : <Moon size={20} />}
        </button>

        {/* Profile Dropdown */}
        <div className="relative ml-2">


          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-3 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors focus:outline-none cursor-pointer"
          >
            <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 text-white font-bold text-sm flex items-center justify-center shadow-xs border-2 border-gray-200 dark:border-slate-700">
              {currentAvatarSrc ? (
                <img src={currentAvatarSrc} alt={user.name} className="w-full h-full object-cover rounded-full" />
              ) : (
                user.name.charAt(0)
              )}
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="text-sm font-bold text-[#292424] dark:text-white leading-tight">
                {user.name}
              </span>
              <span className="text-xs text-gray-400 dark:text-slate-400 font-normal leading-tight">
                {user.role}
              </span>
            </div>
            <ChevronDown size={16} className="text-gray-400 dark:text-slate-400 hidden md:block" />
          </button>



          {/* Profile Menu Dropdown */}
          {isProfileOpen && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setIsProfileOpen(false)} 
              />
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xs shadow-xl border border-gray-100 dark:border-slate-700 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-4 py-2 border-b border-gray-100 dark:border-slate-700 md:hidden">
                  <p className="text-xs font-semibold text-[#292424] dark:text-white">{user.name}</p>
                  <p className="text-[10px] text-gray-400 dark:text-slate-400">{user.role}</p>
                </div>
                
                <button
                  onClick={() => {
                    setIsProfileOpen(false)
                    if (setActiveRoute) setActiveRoute('profile-settings')
                  }}
                  className="w-full px-4 py-2 text-left text-xs text-gray-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-700 hover:text-[#043486] dark:hover:text-blue-400 flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <User size={14} />
                  <span>Profile Settings</span>
                </button>

                <button
                  onClick={() => {
                    setIsProfileOpen(false)
                    if (setActiveRoute) setActiveRoute('system-settings')
                  }}
                  className="w-full px-4 py-2 text-left text-xs text-gray-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-700 hover:text-[#043486] dark:hover:text-blue-400 flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <SettingsIcon size={14} />
                  <span>System Settings</span>
                </button>


                <div className="my-1 border-t border-gray-100 dark:border-slate-700" />

                <button
                  onClick={() => {
                    setIsProfileOpen(false)
                    onLogout()
                  }}
                  className="w-full px-4 py-2 text-left text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center gap-2.5 transition-colors font-medium cursor-pointer"
                >
                  <LogOut size={14} />
                  <span>Log Out</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
