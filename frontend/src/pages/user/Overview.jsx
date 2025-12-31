import Card from '../../components/ui/Card'
import { Link } from 'react-router-dom'

function UserOverview() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        خوش آمدید
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link to="/user/buy">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🛒</span>
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                خرید اکانت VPN
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                انتخاب پلن و خرید اشتراک
              </p>
            </div>
          </Card>
        </Link>

        <Link to="/user/accounts">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🔑</span>
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                اکانت‌های من
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                مشاهده و مدیریت اکانت‌ها
              </p>
            </div>
          </Card>
        </Link>
      </div>
    </div>
  )
}

export default UserOverview
