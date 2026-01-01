import { Routes, Route, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import {
  HomeIcon,
  UserPlusIcon,
  UsersIcon,
  CreditCardIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline'
import clsx from 'clsx'

// Agent pages
import AgentOverview from './Overview'
import CreateUser from './CreateUser'
import MyUsers from './MyUsers'
import Wallet from './Wallet'

const navigation = [
  { name: 'داشبورد', href: '/agent', icon: HomeIcon },
  { name: 'ساخت کاربر', href: '/agent/create', icon: UserPlusIcon },
  { name: 'کاربران من', href: '/agent/users', icon: UsersIcon },
  { name: 'کیف پول', href: '/agent/wallet', icon: CreditCardIcon },
]

function AgentDashboard() {
  const { user, logout } = useAuth()
  const location = useLocation()

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar */}
      <div className="fixed inset-y-0 right-0 w-64 bg-white dark:bg-gray-800 shadow-lg">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-center h-16 px-4 border-b dark:border-gray-700">
            <h1 className="text-xl font-bold text-primary-600">RAD Panel</h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href

              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={clsx(
                    'flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-colors',
                    isActive
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                  )}
                >
                  <item.icon className="w-5 h-5 ml-3" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* User info */}
          <div className="p-4 border-t dark:border-gray-700">
            <div className="flex items-center mb-3">
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                <span className="text-primary-700 font-bold">
                  {user?.username?.[0]?.toUpperCase()}
                </span>
              </div>
              <div className="mr-3">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {user?.username}
                </p>
                <p className="text-xs text-gray-500">نماینده</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5 ml-2" />
              خروج
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="mr-64 min-h-screen">
        <main className="p-6">
          <Routes>
            <Route path="/" element={<AgentOverview />} />
            <Route path="/create" element={<CreateUser />} />
            <Route path="/users" element={<MyUsers />} />
            <Route path="/wallet" element={<Wallet />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

export default AgentDashboard
