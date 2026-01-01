import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { paymentsAPI } from '../../services/api'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import toast from 'react-hot-toast'

function Payments() {
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState('PENDING')

  const { data, isLoading } = useQuery({
    queryKey: ['payments', filter],
    queryFn: () => paymentsAPI.list({ status: filter }).then(res => res.data),
  })

  const approveMutation = useMutation({
    mutationFn: (id) => paymentsAPI.approve(id, {}),
    onSuccess: () => {
      queryClient.invalidateQueries(['payments'])
      toast.success('پرداخت تایید شد')
    },
  })

  const rejectMutation = useMutation({
    mutationFn: (id) => paymentsAPI.reject(id, { admin_notes: 'رد شده توسط مدیر' }),
    onSuccess: () => {
      queryClient.invalidateQueries(['payments'])
      toast.success('پرداخت رد شد')
    },
  })

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
          مدیریت پرداخت‌ها
        </h1>
        <div className="flex gap-2">
          {['PENDING', 'APPROVED', 'REJECTED'].map((status) => (
            <Button
              key={status}
              variant={filter === status ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setFilter(status)}
            >
              {status === 'PENDING' ? 'در انتظار' : status === 'APPROVED' ? 'تایید شده' : 'رد شده'}
            </Button>
          ))}
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b dark:border-gray-700">
                <th className="text-right py-3 px-4">کاربر</th>
                <th className="text-right py-3 px-4">مبلغ</th>
                <th className="text-right py-3 px-4">روش پرداخت</th>
                <th className="text-right py-3 px-4">رسید</th>
                <th className="text-right py-3 px-4">تاریخ</th>
                <th className="text-right py-3 px-4">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {data?.payments?.map((payment) => (
                <tr key={payment.id} className="border-b dark:border-gray-700">
                  <td className="py-3 px-4">{payment.username}</td>
                  <td className="py-3 px-4 font-bold">
                    {Number(payment.amount).toLocaleString('fa-IR')} تومان
                  </td>
                  <td className="py-3 px-4">{payment.payment_method_alias}</td>
                  <td className="py-3 px-4">
                    {payment.receipt_url && (
                      <a
                        href={payment.receipt_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:underline"
                      >
                        مشاهده رسید
                      </a>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {new Date(payment.created_at).toLocaleDateString('fa-IR')}
                  </td>
                  <td className="py-3 px-4">
                    {payment.status === 'PENDING' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="success"
                          onClick={() => approveMutation.mutate(payment.id)}
                          loading={approveMutation.isLoading}
                        >
                          تایید
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => rejectMutation.mutate(payment.id)}
                          loading={rejectMutation.isLoading}
                        >
                          رد
                        </Button>
                      </div>
                    )}
                    {payment.status !== 'PENDING' && (
                      <span className={`px-2 py-1 rounded text-xs ${
                        payment.status === 'APPROVED'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {payment.status === 'APPROVED' ? 'تایید شده' : 'رد شده'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

export default Payments
