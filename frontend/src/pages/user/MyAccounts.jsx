import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ordersAPI } from '../../services/api'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'

const ORDER_STATUS = {
  ACTIVE: { label: 'فعال', color: 'bg-green-100 text-green-800' },
  EXPIRED: { label: 'منقضی شده', color: 'bg-gray-100 text-gray-800' },
  DISABLED: { label: 'غیرفعال', color: 'bg-red-100 text-red-800' },
  REFUNDED: { label: 'استرداد شده', color: 'bg-yellow-100 text-yellow-800' },
  PENDING: { label: 'در انتظار تایید', color: 'bg-yellow-100 text-yellow-800' },
}

function MyAccounts() {
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['my-orders'],
    queryFn: () => ordersAPI.myOrders({ page: 1, page_size: 100 }).then(res => res.data),
  })

  const openDetail = (order) => {
    setSelectedOrder(order)
    setIsDetailOpen(true)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    toast.success('لینک کپی شد')
  }

  const calculateDaysRemaining = (expiresAt) => {
    const now = new Date()
    const expires = new Date(expiresAt)
    const diff = expires - now
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
    return days > 0 ? days : 0
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const activeOrders = data?.orders?.filter(o => o.status === 'ACTIVE') || []
  const otherOrders = data?.orders?.filter(o => o.status !== 'ACTIVE') || []

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          اکانت‌های من
        </h1>
        <Link to="/user/buy">
          <Button>خرید اکانت جدید</Button>
        </Link>
      </div>

      {/* Active Accounts */}
      {activeOrders.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            اکانت‌های فعال
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activeOrders.map((order) => (
              <Card key={order.id} className="border-l-4 border-green-500">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                      {order.plan_name}
                    </h3>
                    <p className="text-sm text-gray-500 font-mono" dir="ltr">
                      {order.marzban_username}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ${ORDER_STATUS[order.status]?.color}`}>
                    {ORDER_STATUS[order.status]?.label}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                  <div>
                    <p className="text-gray-500">حجم</p>
                    <p className="font-medium">{order.data_limit_gb} گیگابایت</p>
                  </div>
                  <div>
                    <p className="text-gray-500">روز باقیمانده</p>
                    <p className="font-medium text-primary-600">
                      {calculateDaysRemaining(order.expires_at)} روز
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="primary"
                    className="flex-1"
                    onClick={() => openDetail(order)}
                  >
                    مشاهده لینک اشتراک
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* No Active Accounts */}
      {activeOrders.length === 0 && (
        <Card className="text-center py-12 mb-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            هیچ اکانت فعالی ندارید
          </h3>
          <p className="text-gray-500 mb-4">
            اولین اکانت VPN خود را همین الان بخرید!
          </p>
          <Link to="/user/buy">
            <Button>خرید اکانت</Button>
          </Link>
        </Card>
      )}

      {/* Other Accounts */}
      {otherOrders.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            سایر اکانت‌ها
          </h2>
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b dark:border-gray-700">
                    <th className="text-right py-3 px-4">نام کاربری</th>
                    <th className="text-right py-3 px-4">پلن</th>
                    <th className="text-right py-3 px-4">تاریخ</th>
                    <th className="text-right py-3 px-4">وضعیت</th>
                  </tr>
                </thead>
                <tbody>
                  {otherOrders.map((order) => (
                    <tr key={order.id} className="border-b dark:border-gray-700">
                      <td className="py-3 px-4 font-mono" dir="ltr">
                        {order.marzban_username}
                      </td>
                      <td className="py-3 px-4">{order.plan_name}</td>
                      <td className="py-3 px-4">{formatDate(order.created_at)}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs ${ORDER_STATUS[order.status]?.color}`}>
                          {ORDER_STATUS[order.status]?.label}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Order Detail Modal */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title="جزئیات اکانت"
        size="md"
      >
        {selectedOrder && (
          <div className="space-y-4">
            <div className="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">نام کاربری</p>
              <p className="font-mono text-xl font-bold" dir="ltr">
                {selectedOrder.marzban_username}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">پلن</p>
                <p className="font-medium">{selectedOrder.plan_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">حجم</p>
                <p className="font-medium">{selectedOrder.data_limit_gb} GB</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">تاریخ شروع</p>
                <p className="font-medium">{formatDate(selectedOrder.created_at)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">تاریخ انقضا</p>
                <p className="font-medium">{formatDate(selectedOrder.expires_at)}</p>
              </div>
            </div>

            {selectedOrder.marzban_subscription_url && (
              <div>
                <p className="text-sm text-gray-500 mb-2">لینک اشتراک</p>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <p className="font-mono text-xs break-all mb-3" dir="ltr">
                    {selectedOrder.marzban_subscription_url}
                  </p>
                  <Button
                    onClick={() => copyToClipboard(selectedOrder.marzban_subscription_url)}
                    className="w-full"
                  >
                    کپی لینک
                  </Button>
                </div>
              </div>
            )}

            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
              <p className="text-sm text-yellow-700 dark:text-yellow-400">
                این لینک را در اپلیکیشن VPN خود وارد کنید.
                (V2rayNG, Clash, Shadowrocket و ...)
              </p>
            </div>

            <div className="flex justify-end pt-4 border-t dark:border-gray-700">
              <Button variant="secondary" onClick={() => setIsDetailOpen(false)}>
                بستن
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default MyAccounts
