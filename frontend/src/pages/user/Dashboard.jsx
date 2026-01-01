import { Routes, Route, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import {
  HomeIcon,
  ShoppingCartIcon,
  KeyIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline'
import clsx from 'clsx'

// User pages
import UserOverview from './Overview'
import BuyAccount from './BuyAccount'
import MyAccounts from './MyAccounts'

const navigation = [
  { name: 'داشبورد', href: '/user', icon: HomeIcon },
  { name: 'خرید اکانت', href: '/user/buy', icon: ShoppingCartIcon },
  { name: 'اکانت‌های من', href: '/user/accounts', icon: KeyIcon },
]

function UserDashboard() {
  const { user, logout } = useAuth()
  const location = useLocation()

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Top Nav */}
      <nav className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-primary-600">RAD Panel</h1>
            </div>

            <div className="flex items-center space-x-4 space-x-reverse">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={clsx(
                    'px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                    location.pathname === item.href
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300'
                  )}
                >
                  {item.name}
                </Link>
              ))}

              <button
                onClick={logout}
                className="flex items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
              >
                <ArrowRightOnRectangleIcon className="w-5 h-5 ml-1" />
                خروج
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-7xl mx-auto py-6 px-4">
        <Routes>
          <Route path="/" element={<UserOverview />} />
          <Route path="/buy" element={<BuyAccount />} />
          <Route path="/accounts" element={<MyAccounts />} />
        </Routes>
      </main>
    </div>
  )
}

export default UserDashboard
