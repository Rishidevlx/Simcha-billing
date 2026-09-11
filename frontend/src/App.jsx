import { useState, useEffect } from 'react'
import LoginPage from './pages/LoginPage'
import DashboardLayout from './components/layout/DashboardLayout'
import DashboardPage from './pages/DashboardPage'

export default function App() {
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [activeRoute, setActiveRoute] = useState('dashboard')
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

  // Verify stored token on app mount
  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('simcha_token')
      const storedUser = localStorage.getItem('simcha_user')

      if (storedToken && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser)
          setUser(parsedUser)
          setIsAuthenticated(true)
        } catch (e) {
          console.error('Failed to parse cached user', e)
          localStorage.removeItem('simcha_token')
          localStorage.removeItem('simcha_user')
        }
      }
      setIsCheckingAuth(false)
    }

    checkAuth()
  }, [])

  const handleLogin = (userData, token, rememberMe) => {
    setUser(userData)
    setIsAuthenticated(true)

    if (rememberMe) {
      localStorage.setItem('simcha_token', token)
      localStorage.setItem('simcha_user', JSON.stringify(userData))
    } else {
      sessionStorage.setItem('simcha_token', token)
      sessionStorage.setItem('simcha_user', JSON.stringify(userData))
    }
  }

  const handleLogout = () => {
    setUser(null)
    setIsAuthenticated(false)
    setActiveRoute('dashboard')
    localStorage.removeItem('simcha_token')
    localStorage.removeItem('simcha_user')
    sessionStorage.removeItem('simcha_token')
    sessionStorage.removeItem('simcha_user')
  }

  if (isCheckingAuth) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#FFFFFF]">
        <div className="w-10 h-10 border-3 border-[#043486] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />
  }

  return (
    <DashboardLayout
      activeRoute={activeRoute}
      setActiveRoute={setActiveRoute}
      onLogout={handleLogout}
      user={user || { name: 'Rishi', email: 'admin@simcha.com', role: 'Administrator', avatar: 'male' }}
    >
      <DashboardPage
        activeRoute={activeRoute}
        setActiveRoute={setActiveRoute}
        user={user || { name: 'Rishi', email: 'admin@simcha.com', role: 'Administrator', avatar: 'male' }}
        onUpdateUser={setUser}
      />
    </DashboardLayout>
  )
}


