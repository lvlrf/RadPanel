import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ordersAPI } from '../../services/api'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import toast from 'react-hot-toast'

const ORDER_STATUS = {
  ACTIVE: { label: 'فعال', color: 'bg-green-100 text-green-800' },
  EXPIRED: { label: 'منقضی شده', color: 'bg-gray-100 text-gray-800' },
  DISABLED: { label: 'غیرفعال', color: 'bg-red-100 text-red-800' },
  REFUNDED: { label: 'استرداد شده', color: 'bg-yellow-100 text-yellow-800' },
}

function Orders() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState('')
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['orders', page, filter],
    queryFn: () => ordersAPI.list({
      page,
      page_size: 20,
      ...(filter && { status: filter }),
    }).then(res => res.data),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => ordersAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['orders'])
      toast.success('سفارش با موفقیت استرداد شد')
      setIsDetailOpen(false)
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'خطا در استرداد سفارش')
    },
  })

  const openDetail = (order) => {
    setSelectedOrder(order)
    setIsDetailOpen(true)
  }

  const handleRefund = (order) => {
    if (window.confirm(`آیا از استرداد سفارش "${order.marzban_username}" اطمینان دارید؟`)) {
      deleteMutation.mutate(order.id)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          لیست سفارشات
        </h1>
        <div className="flex gap-2">
          <Button
            variant={filter === '' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => { setFilter(''); setPage(1) }}
          >
            همه
          </Button>
          {Object.entries(ORDER_STATUS).map(([key, { label }]) => (
            <Button
              key={key}
              variant={filter === key ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => { setFilter(key); setPage(1) }}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b dark:border-gray-700">
                <th className="text-right py-3 px-4">نام کاربری Marzban</th>
                <th className="text-right py-3 px-4">پلن</th>
                <th className="text-right py-3 px-4">نماینده</th>
                <th className="text-right py-3 px-4">قیمت</th>
                <th className="text-right py-3 px-4">تاریخ شروع</th>
                <th className="text-right py-3 px-4">تاریخ پایان</th>
                <th className="text-right py-3 px-4">وضعیت</th>
                <th className="text-right py-3 px-4">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {data?.orders?.map((order) => (
                <tr key={order.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="py-3 px-4 font-mono" dir="ltr">
                    {order.marzban_username}
                  </td>
                  <td className="py-3 px-4">{order.plan_name}</td>
                  <td className="py-3 px-4">{order.agent_username || 'عمومی'}</td>
                  <td className="py-3 px-4 font-medium">
                    {Number(order.price_paid).toLocaleString('fa-IR')} تومان
                  </td>
                  <td className="py-3 px-4">{formatDate(order.created_at)}</td>
                  <td className="py-3 px-4">{formatDate(order.expires_at)}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded text-xs ${ORDER_STATUS[order.status]?.color || 'bg-gray-100 text-gray-800'}`}>
                      {ORDER_STATUS[order.status]?.label || order.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <Button size="sm" variant="secondary" onClick={() => openDetail(order)}>
                        جزئیات
                      </Button>
                      {order.status === 'ACTIVE' && (
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleRefund(order)}
                          loading={deleteMutation.isLoading}
                        >
                          استرداد
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {data?.orders?.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            سفارشی یافت نشد
          </div>
        )}

        {/* Pagination */}
        <div className="flex justify-between items-center mt-4 pt-4 border-t dark:border-gray-700">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            نمایش {data?.orders?.length || 0} از {data?.total || 0} سفارش
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
            >
              قبلی
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={(data?.orders?.length || 0) < 20}
              onClick={() => setPage(p => p + 1)}
            >
              بعدی
            </Button>
          </div>
        </div>
      </Card>

      {/* Order Detail Modal */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title="جزئیات سفارش"
        size="md"
      >
        {selectedOrder && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                  نام کاربری Marzban
                </label>
                <p className="font-mono text-lg" dir="ltr">{selectedOrder.marzban_username}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                  وضعیت
                </label>
                <span className={`inline-block px-2 py-1 rounded text-xs ${ORDER_STATUS[selectedOrder.status]?.color}`}>
                  {ORDER_STATUS[selectedOrder.status]?.label}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                  پلن
                </label>
                <p>{selectedOrder.plan_name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                  نماینده
                </label>
                <p>{selectedOrder.agent_username || 'عمومی'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                  مبلغ پرداختی
                </label>
                <p className="text-lg font-bold text-primary-600">
                  {Number(selectedOrder.price_paid).toLocaleString('fa-IR')} تومان
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                  حجم / مدت
                </label>
                <p>{selectedOrder.data_limit_gb} GB / {selectedOrder.days} روز</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                  تاریخ شروع
                </label>
                <p>{formatDate(selectedOrder.created_at)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                  تاریخ پایان
                </label>
                <p>{formatDate(selectedOrder.expires_at)}</p>
              </div>
            </div>

            {selectedOrder.marzban_subscription_url && (
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                  لینک اشتراک
                </label>
                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                  <p className="font-mono text-xs break-all" dir="ltr">
                    {selectedOrder.marzban_subscription_url}
                  </p>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
              <Button variant="secondary" onClick={() => setIsDetailOpen(false)}>
                بستن
              </Button>
              {selectedOrder.status === 'ACTIVE' && (
                <Button
                  variant="danger"
                  onClick={() => handleRefund(selectedOrder)}
                  loading={deleteMutation.isLoading}
                >
                  استرداد سفارش
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default Orders
