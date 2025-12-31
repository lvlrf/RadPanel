import { useQuery } from '@tanstack/react-query'
import { reportsAPI } from '../../services/api'
import Card from '../../components/ui/Card'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import {
  UsersIcon,
  DocumentTextIcon,
  ClockIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline'

function Overview() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => reportsAPI.stats().then(res => res.data),
  })

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const statCards = [
    {
      name: 'تعداد نمایندگان',
      value: stats?.total_agents || 0,
      icon: UsersIcon,
      color: 'bg-blue-500',
    },
    {
      name: 'سفارشات فعال',
      value: stats?.active_orders || 0,
      icon: DocumentTextIcon,
      color: 'bg-green-500',
    },
    {
      name: 'پرداخت‌های در انتظار',
      value: stats?.pending_payments || 0,
      icon: ClockIcon,
      color: 'bg-yellow-500',
    },
    {
      name: 'درآمد کل (تومان)',
      value: (stats?.total_revenue || 0).toLocaleString('fa-IR'),
      icon: BanknotesIcon,
      color: 'bg-purple-500',
    },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        داشبورد مدیریت
      </h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat) => (
          <Card key={stat.name} className="relative overflow-hidden">
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <div className="mr-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stat.value}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <Card.Header>
          <Card.Title>دسترسی سریع</Card.Title>
        </Card.Header>
        <Card.Content>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <a
              href="/admin/agents"
              className="p-4 text-center rounded-lg bg-gray-50 hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
            >
              <UsersIcon className="w-8 h-8 mx-auto text-primary-600 mb-2" />
              <span className="text-sm font-medium">افزودن نماینده</span>
            </a>
            <a
              href="/admin/payments"
              className="p-4 text-center rounded-lg bg-gray-50 hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
            >
              <ClockIcon className="w-8 h-8 mx-auto text-yellow-600 mb-2" />
              <span className="text-sm font-medium">تایید پرداخت‌ها</span>
            </a>
            <a
              href="/admin/plans"
              className="p-4 text-center rounded-lg bg-gray-50 hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
            >
              <DocumentTextIcon className="w-8 h-8 mx-auto text-green-600 mb-2" />
              <span className="text-sm font-medium">مدیریت پلن‌ها</span>
            </a>
            <a
              href="/admin/reports"
              className="p-4 text-center rounded-lg bg-gray-50 hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
            >
              <BanknotesIcon className="w-8 h-8 mx-auto text-purple-600 mb-2" />
              <span className="text-sm font-medium">گزارش مالی</span>
            </a>
          </div>
        </Card.Content>
      </Card>
    </div>
  )
}

export default Overview
