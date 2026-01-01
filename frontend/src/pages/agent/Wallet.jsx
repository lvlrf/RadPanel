import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usersAPI, paymentMethodsAPI, paymentsAPI } from '../../services/api'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Modal from '../../components/ui/Modal'
import Select from '../../components/ui/Select'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import toast from 'react-hot-toast'

const PAYMENT_STATUS = {
  PENDING: { label: 'در انتظار تایید', color: 'bg-yellow-100 text-yellow-800' },
  APPROVED: { label: 'تایید شده', color: 'bg-green-100 text-green-800' },
  REJECTED: { label: 'رد شده', color: 'bg-red-100 text-red-800' },
}

function Wallet() {
  const queryClient = useQueryClient()
  const fileInputRef = useRef(null)
  const [isChargeOpen, setIsChargeOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [selectedMethod, setSelectedMethod] = useState('')
  const [receiptFile, setReceiptFile] = useState(null)
  const [page, setPage] = useState(1)

  const { data: wallet, isLoading: walletLoading } = useQuery({
    queryKey: ['wallet'],
    queryFn: () => usersAPI.getWallet().then(res => res.data),
  })

  const { data: paymentMethods } = useQuery({
    queryKey: ['payment-methods'],
    queryFn: () => paymentMethodsAPI.listPublic().then(res => res.data),
  })

  const { data: payments } = useQuery({
    queryKey: ['my-payments', page],
    queryFn: () => paymentsAPI.myPayments({ page, page_size: 10 }).then(res => res.data),
  })

  const uploadMutation = useMutation({
    mutationFn: (formData) => paymentsAPI.upload(formData),
    onSuccess: () => {
      queryClient.invalidateQueries(['wallet'])
      queryClient.invalidateQueries(['my-payments'])
      toast.success('رسید با موفقیت ارسال شد. اعتبار امانی به حساب شما اضافه شد.')
      setIsChargeOpen(false)
      resetForm()
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'خطا در ارسال رسید')
    },
  })

  const resetForm = () => {
    setAmount('')
    setSelectedMethod('')
    setReceiptFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!amount || !selectedMethod || !receiptFile) {
      toast.error('لطفاً همه فیلدها را پر کنید')
      return
    }

    const formData = new FormData()
    formData.append('amount', amount)
    formData.append('payment_method_id', selectedMethod)
    formData.append('receipt', receiptFile)

    uploadMutation.mutate(formData)
  }

  const selectedMethodData = paymentMethods?.payment_methods?.find(
    m => m.id.toString() === selectedMethod
  )

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

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
        کیف پول
      </h1>

      {/* Wallet Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <p className="text-sm text-gray-500 mb-1">اعتبار کل</p>
          <p className="text-3xl font-bold text-primary-600">
            {Number(wallet?.total_credit || 0).toLocaleString('fa-IR')}
          </p>
          <p className="text-sm text-gray-400">تومان</p>
        </Card>

        <Card>
          <p className="text-sm text-gray-500 mb-1">اعتبار تایید شده</p>
          <p className="text-3xl font-bold text-green-600">
            {Number(wallet?.credit_confirmed || 0).toLocaleString('fa-IR')}
          </p>
          <p className="text-sm text-gray-400">تومان</p>
        </Card>

        <Card>
          <p className="text-sm text-gray-500 mb-1">اعتبار امانی</p>
          <p className="text-3xl font-bold text-yellow-600">
            {Number(wallet?.credit_pending || 0).toLocaleString('fa-IR')}
          </p>
          <p className="text-sm text-gray-400">تومان (در انتظار تایید)</p>
        </Card>
      </div>

      {/* Negative Credit Warning */}
      {wallet?.is_negative && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-600 dark:text-red-400 font-medium">
            اعتبار شما منفی است!
          </p>
          <p className="text-sm text-red-500 mt-1">
            لطفاً کیف پول را شارژ کنید. در صورت عدم شارژ در ۲۴ ساعت، کاربران شما غیرفعال خواهند شد.
          </p>
        </div>
      )}

      {/* Charge Button */}
      <div className="mb-6">
        <Button onClick={() => setIsChargeOpen(true)} size="lg">
          شارژ کیف پول
        </Button>
      </div>

      {/* Payment History */}
      <Card>
        <Card.Header>
          <Card.Title>تاریخچه پرداخت‌ها</Card.Title>
        </Card.Header>
        <Card.Content>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b dark:border-gray-700">
                  <th className="text-right py-3 px-4">تاریخ</th>
                  <th className="text-right py-3 px-4">مبلغ</th>
                  <th className="text-right py-3 px-4">روش پرداخت</th>
                  <th className="text-right py-3 px-4">وضعیت</th>
                  <th className="text-right py-3 px-4">رسید</th>
                </tr>
              </thead>
              <tbody>
                {payments?.payments?.map((payment) => (
                  <tr key={payment.id} className="border-b dark:border-gray-700">
                    <td className="py-3 px-4">{formatDate(payment.created_at)}</td>
                    <td className="py-3 px-4 font-medium">
                      {Number(payment.amount).toLocaleString('fa-IR')} تومان
                    </td>
                    <td className="py-3 px-4">{payment.payment_method_alias}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs ${PAYMENT_STATUS[payment.status]?.color}`}>
                        {PAYMENT_STATUS[payment.status]?.label}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {payment.receipt_url && (
                        <a
                          href={payment.receipt_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:underline"
                        >
                          مشاهده
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {payments?.payments?.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              هیچ پرداختی ثبت نشده است
            </div>
          )}

          {payments?.payments?.length > 0 && (
            <div className="flex justify-center gap-2 mt-4 pt-4 border-t dark:border-gray-700">
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
                disabled={(payments?.payments?.length || 0) < 10}
                onClick={() => setPage(p => p + 1)}
              >
                بعدی
              </Button>
            </div>
          )}
        </Card.Content>
      </Card>

      {/* Charge Modal */}
      <Modal
        isOpen={isChargeOpen}
        onClose={() => setIsChargeOpen(false)}
        title="شارژ کیف پول"
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="مبلغ (تومان)"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            placeholder="مثال: 500000"
            dir="ltr"
          />

          <Select
            label="روش پرداخت"
            value={selectedMethod}
            onChange={(e) => setSelectedMethod(e.target.value)}
            required
          >
            <option value="">انتخاب کنید...</option>
            {paymentMethods?.payment_methods?.map((method) => (
              <option key={method.id} value={method.id}>
                {method.alias}
              </option>
            ))}
          </Select>

          {/* Show Payment Details */}
          {selectedMethodData && (
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <p className="text-sm font-medium mb-2">اطلاعات پرداخت:</p>
              {selectedMethodData.type === 'CARD' && selectedMethodData.display_card && (
                <p className="font-mono text-lg" dir="ltr">{selectedMethodData.display_card}</p>
              )}
              {selectedMethodData.type === 'SHEBA' && selectedMethodData.config?.sheba && (
                <p className="font-mono text-sm" dir="ltr">{selectedMethodData.config.sheba}</p>
              )}
              {selectedMethodData.type === 'CRYPTO' && (
                <div>
                  <p className="text-sm">شبکه: {selectedMethodData.config?.network}</p>
                  <p className="font-mono text-xs break-all" dir="ltr">
                    {selectedMethodData.config?.address}
                  </p>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              تصویر رسید پرداخت
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => setReceiptFile(e.target.files[0])}
              required
              className="block w-full text-sm text-gray-500 file:ml-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
            />
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
            <p className="text-sm text-yellow-700 dark:text-yellow-400">
              پس از ارسال رسید، اعتبار امانی به حساب شما اضافه می‌شود.
              پس از تایید مدیر، اعتبار شما تایید شده محسوب خواهد شد.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsChargeOpen(false)}>
              انصراف
            </Button>
            <Button type="submit" loading={uploadMutation.isLoading}>
              ارسال رسید
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default Wallet
