import { useQuery } from '@tanstack/react-query'
import { usersAPI, ordersAPI } from '../../services/api'
import Card from '../../components/ui/Card'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { Link } from 'react-router-dom'

function AgentOverview() {
  const { data: wallet, isLoading: walletLoading } = useQuery({
    queryKey: ['wallet'],
    queryFn: () => usersAPI.getWallet().then(res => res.data),
  })

  const { data: orders } = useQuery({
    queryKey: ['my-orders'],
    queryFn: () => ordersAPI.myOrders({ page: 1, page_size: 5 }).then(res => res.data),
  })

  if (walletLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        داشبورد نماینده
      </h1>

      {/* Wallet Card */}
      <Card className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">اعتبار کل</p>
            <p className="text-3xl font-bold text-primary-600">
              {Number(wallet?.total_credit || 0).toLocaleString('fa-IR')} تومان
            </p>
          </div>
          <Link
            to="/agent/wallet"
            className="text-sm text-primary-600 hover:underline"
          >
            جزئیات کیف پول
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t dark:border-gray-700">
          <div>
            <p className="text-xs text-gray-500">اعتبار تایید شده</p>
            <p className="text-lg font-semibold text-green-600">
              {Number(wallet?.credit_confirmed || 0).toLocaleString('fa-IR')}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">اعتبار امانی</p>
            <p className="text-lg font-semibold text-yellow-600">
              {Number(wallet?.credit_pending || 0).toLocaleString('fa-IR')}
            </p>
          </div>
        </div>

        {wallet?.is_negative && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <p className="text-sm text-red-600">
              اعتبار شما منفی است. لطفاً کیف پول را شارژ کنید.
            </p>
          </div>
        )}
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Link
          to="/agent/create"
          className="p-6 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-center"
        >
          <p className="text-lg font-bold">ساخت کاربر جدید</p>
          <p className="text-sm opacity-80">ایجاد اکانت VPN</p>
        </Link>
        <Link
          to="/agent/wallet"
          className="p-6 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-center"
        >
          <p className="text-lg font-bold">شارژ کیف پول</p>
          <p className="text-sm opacity-80">افزایش اعتبار</p>
        </Link>
      </div>

      {/* Recent Orders */}
      <Card>
        <Card.Header>
          <div className="flex justify-between items-center">
            <Card.Title>آخرین سفارشات</Card.Title>
            <Link to="/agent/users" className="text-sm text-primary-600 hover:underline">
              مشاهده همه
            </Link>
          </div>
        </Card.Header>
        <Card.Content>
          {orders?.orders?.length ? (
            <div className="space-y-3">
              {orders.orders.map((order) => (
                <div key={order.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div>
                    <p className="font-medium">{order.marzban_username}</p>
                    <p className="text-sm text-gray-500">{order.plan_name}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ${
                    order.status === 'ACTIVE'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {order.status === 'ACTIVE' ? 'فعال' : order.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">سفارشی ثبت نشده است</p>
          )}
        </Card.Content>
      </Card>
    </div>
  )
}

export default AgentOverview
