import { useState, useRef } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { plansAPI, marzbanAPI, ordersAPI, paymentMethodsAPI, paymentsAPI } from '../../services/api'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import toast from 'react-hot-toast'

function BuyAccount() {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const [step, setStep] = useState(1) // 1: Select Plan, 2: Username, 3: Payment, 4: Complete
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [marzbanUsername, setMarzbanUsername] = useState('')
  const [usernameAvailable, setUsernameAvailable] = useState(null)
  const [checkingUsername, setCheckingUsername] = useState(false)
  const [selectedMethod, setSelectedMethod] = useState('')
  const [receiptFile, setReceiptFile] = useState(null)

  const { data: plansData, isLoading: plansLoading } = useQuery({
    queryKey: ['plans'],
    queryFn: () => plansAPI.list().then(res => res.data),
  })

  const { data: paymentMethods } = useQuery({
    queryKey: ['payment-methods'],
    queryFn: () => paymentMethodsAPI.listPublic().then(res => res.data),
    enabled: step >= 3,
  })

  const createOrderMutation = useMutation({
    mutationFn: (formData) => {
      // First upload payment, then create order
      return paymentsAPI.upload(formData).then(() => {
        return ordersAPI.create({
          plan_id: selectedPlan.id,
          marzban_username: marzbanUsername,
        })
      })
    },
    onSuccess: () => {
      toast.success('سفارش شما با موفقیت ثبت شد!')
      setStep(4)
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'خطا در ثبت سفارش')
    },
  })

  const checkUsername = async () => {
    if (!marzbanUsername || marzbanUsername.length < 3) {
      toast.error('نام کاربری باید حداقل ۳ کاراکتر باشد')
      return
    }

    setCheckingUsername(true)
    try {
      const response = await marzbanAPI.checkUsername(marzbanUsername)
      setUsernameAvailable(response.data.available)
      if (!response.data.available) {
        toast.error('این نام کاربری قبلاً استفاده شده است')
      } else {
        toast.success('نام کاربری در دسترس است')
      }
    } catch (error) {
      toast.error('خطا در بررسی نام کاربری')
      setUsernameAvailable(null)
    } finally {
      setCheckingUsername(false)
    }
  }

  const handleSubmit = () => {
    if (!selectedMethod || !receiptFile) {
      toast.error('لطفاً رسید پرداخت را آپلود کنید')
      return
    }

    const formData = new FormData()
    formData.append('amount', selectedPlan.price_public)
    formData.append('payment_method_id', selectedMethod)
    formData.append('receipt', receiptFile)

    createOrderMutation.mutate(formData)
  }

  const selectedMethodData = paymentMethods?.payment_methods?.find(
    m => m.id.toString() === selectedMethod
  )

  const activePlans = plansData?.plans?.filter(p => p.status === 'ACTIVE') || []

  if (plansLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        خرید اکانت VPN
      </h1>

      {/* Stepper */}
      <div className="flex items-center mb-8 overflow-x-auto">
        <div className={`flex items-center ${step >= 1 ? 'text-primary-600' : 'text-gray-400'}`}>
          <span className={`w-8 h-8 rounded-full flex items-center justify-center border-2 flex-shrink-0 ${step >= 1 ? 'border-primary-600 bg-primary-600 text-white' : 'border-gray-300'}`}>
            1
          </span>
          <span className="mr-2 whitespace-nowrap">انتخاب پلن</span>
        </div>
        <div className={`flex-1 h-1 mx-4 min-w-[20px] ${step >= 2 ? 'bg-primary-600' : 'bg-gray-200'}`} />
        <div className={`flex items-center ${step >= 2 ? 'text-primary-600' : 'text-gray-400'}`}>
          <span className={`w-8 h-8 rounded-full flex items-center justify-center border-2 flex-shrink-0 ${step >= 2 ? 'border-primary-600 bg-primary-600 text-white' : 'border-gray-300'}`}>
            2
          </span>
          <span className="mr-2 whitespace-nowrap">نام کاربری</span>
        </div>
        <div className={`flex-1 h-1 mx-4 min-w-[20px] ${step >= 3 ? 'bg-primary-600' : 'bg-gray-200'}`} />
        <div className={`flex items-center ${step >= 3 ? 'text-primary-600' : 'text-gray-400'}`}>
          <span className={`w-8 h-8 rounded-full flex items-center justify-center border-2 flex-shrink-0 ${step >= 3 ? 'border-primary-600 bg-primary-600 text-white' : 'border-gray-300'}`}>
            3
          </span>
          <span className="mr-2 whitespace-nowrap">پرداخت</span>
        </div>
        <div className={`flex-1 h-1 mx-4 min-w-[20px] ${step >= 4 ? 'bg-primary-600' : 'bg-gray-200'}`} />
        <div className={`flex items-center ${step >= 4 ? 'text-primary-600' : 'text-gray-400'}`}>
          <span className={`w-8 h-8 rounded-full flex items-center justify-center border-2 flex-shrink-0 ${step >= 4 ? 'border-primary-600 bg-primary-600 text-white' : 'border-gray-300'}`}>
            4
          </span>
          <span className="mr-2 whitespace-nowrap">تکمیل</span>
        </div>
      </div>

      {/* Step 1: Select Plan */}
      {step === 1 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activePlans.map((plan) => (
            <Card
              key={plan.id}
              className="cursor-pointer transition-all hover:shadow-lg hover:border-primary-500 border-2 border-transparent"
              onClick={() => {
                setSelectedPlan(plan)
                setStep(2)
              }}
            >
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                {plan.name}
              </h3>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <p><span className="font-medium">مدت:</span> {plan.days} روز</p>
                <p><span className="font-medium">حجم:</span> {plan.data_limit_gb} گیگابایت</p>
                {plan.description && (
                  <p className="text-xs">{plan.description}</p>
                )}
              </div>
              <div className="mt-4 pt-4 border-t dark:border-gray-700">
                <p className="text-2xl font-bold text-primary-600">
                  {Number(plan.price_public).toLocaleString('fa-IR')} تومان
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Step 2: Username */}
      {step === 2 && (
        <Card>
          <h3 className="text-lg font-bold mb-4">انتخاب نام کاربری</h3>
          <p className="text-sm text-gray-500 mb-4">
            یک نام کاربری منحصر به فرد انتخاب کنید. این نام برای اتصال به VPN استفاده می‌شود.
          </p>

          <div className="flex gap-3 mb-6">
            <Input
              value={marzbanUsername}
              onChange={(e) => {
                setMarzbanUsername(e.target.value.toLowerCase())
                setUsernameAvailable(null)
              }}
              placeholder="username"
              dir="ltr"
              className="flex-1"
            />
            <Button
              variant="secondary"
              onClick={checkUsername}
              loading={checkingUsername}
            >
              بررسی
            </Button>
          </div>

          {usernameAvailable !== null && (
            <div className={`p-3 rounded-lg mb-6 ${
              usernameAvailable
                ? 'bg-green-50 text-green-700'
                : 'bg-red-50 text-red-700'
            }`}>
              {usernameAvailable
                ? 'نام کاربری در دسترس است'
                : 'این نام کاربری قبلاً استفاده شده است'
              }
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setStep(1)}>
              بازگشت
            </Button>
            <Button
              disabled={!usernameAvailable}
              onClick={() => setStep(3)}
            >
              ادامه
            </Button>
          </div>
        </Card>
      )}

      {/* Step 3: Payment */}
      {step === 3 && (
        <Card>
          <h3 className="text-lg font-bold mb-6">پرداخت</h3>

          {/* Order Summary */}
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg space-y-2 mb-6">
            <div className="flex justify-between">
              <span className="text-gray-500">پلن:</span>
              <span className="font-medium">{selectedPlan?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">مدت / حجم:</span>
              <span>{selectedPlan?.days} روز / {selectedPlan?.data_limit_gb} GB</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">نام کاربری:</span>
              <span className="font-mono" dir="ltr">{marzbanUsername}</span>
            </div>
            <div className="flex justify-between pt-2 border-t dark:border-gray-600">
              <span className="text-gray-500">مبلغ قابل پرداخت:</span>
              <span className="text-xl font-bold text-primary-600">
                {Number(selectedPlan?.price_public || 0).toLocaleString('fa-IR')} تومان
              </span>
            </div>
          </div>

          {/* Payment Method Selection */}
          <Select
            label="روش پرداخت"
            value={selectedMethod}
            onChange={(e) => setSelectedMethod(e.target.value)}
            className="mb-4"
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
            <div className="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg mb-4">
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

          {/* Receipt Upload */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              تصویر رسید پرداخت
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => setReceiptFile(e.target.files[0])}
              className="block w-full text-sm text-gray-500 file:ml-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
            />
          </div>

          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setStep(2)}>
              بازگشت
            </Button>
            <Button
              onClick={handleSubmit}
              loading={createOrderMutation.isLoading}
              disabled={!selectedMethod || !receiptFile}
            >
              ثبت سفارش
            </Button>
          </div>
        </Card>
      )}

      {/* Step 4: Complete */}
      {step === 4 && (
        <Card className="text-center py-12">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            سفارش شما ثبت شد!
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            پس از تایید پرداخت توسط مدیر، اکانت شما فعال خواهد شد.
          </p>
          <Button onClick={() => navigate('/user/accounts')}>
            مشاهده اکانت‌های من
          </Button>
        </Card>
      )}
    </div>
  )
}

export default BuyAccount
