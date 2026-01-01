import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { plansAPI, marzbanAPI, ordersAPI, usersAPI } from '../../services/api'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import toast from 'react-hot-toast'

function CreateUser() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1) // 1: Select Plan, 2: Enter Username, 3: Confirm
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [marzbanUsername, setMarzbanUsername] = useState('')
  const [usernameAvailable, setUsernameAvailable] = useState(null)
  const [checkingUsername, setCheckingUsername] = useState(false)

  const { data: plansData, isLoading: plansLoading } = useQuery({
    queryKey: ['plans'],
    queryFn: () => plansAPI.list().then(res => res.data),
  })

  const { data: wallet } = useQuery({
    queryKey: ['wallet'],
    queryFn: () => usersAPI.getWallet().then(res => res.data),
  })

  const createOrderMutation = useMutation({
    mutationFn: (data) => ordersAPI.create(data),
    onSuccess: (response) => {
      toast.success('کاربر با موفقیت ساخته شد!')
      navigate('/agent/users')
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'خطا در ساخت کاربر')
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

  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan)
    setStep(2)
  }

  const handleSubmit = () => {
    if (!selectedPlan || !marzbanUsername || !usernameAvailable) {
      toast.error('لطفاً اطلاعات را کامل کنید')
      return
    }

    createOrderMutation.mutate({
      plan_id: selectedPlan.id,
      marzban_username: marzbanUsername,
    })
  }

  const activePlans = plansData?.plans?.filter(p => p.status === 'ACTIVE') || []
  const totalCredit = (wallet?.credit_confirmed || 0) + (wallet?.credit_pending || 0)

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
        ساخت کاربر جدید
      </h1>

      {/* Credit Warning */}
      {wallet?.is_negative && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-600 dark:text-red-400">
            اعتبار شما منفی است. امکان ساخت کاربر جدید وجود ندارد. لطفاً کیف پول را شارژ کنید.
          </p>
        </div>
      )}

      {/* Stepper */}
      <div className="flex items-center mb-8">
        <div className={`flex items-center ${step >= 1 ? 'text-primary-600' : 'text-gray-400'}`}>
          <span className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 1 ? 'border-primary-600 bg-primary-600 text-white' : 'border-gray-300'}`}>
            1
          </span>
          <span className="mr-2">انتخاب پلن</span>
        </div>
        <div className={`flex-1 h-1 mx-4 ${step >= 2 ? 'bg-primary-600' : 'bg-gray-200'}`} />
        <div className={`flex items-center ${step >= 2 ? 'text-primary-600' : 'text-gray-400'}`}>
          <span className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 2 ? 'border-primary-600 bg-primary-600 text-white' : 'border-gray-300'}`}>
            2
          </span>
          <span className="mr-2">نام کاربری</span>
        </div>
        <div className={`flex-1 h-1 mx-4 ${step >= 3 ? 'bg-primary-600' : 'bg-gray-200'}`} />
        <div className={`flex items-center ${step >= 3 ? 'text-primary-600' : 'text-gray-400'}`}>
          <span className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 3 ? 'border-primary-600 bg-primary-600 text-white' : 'border-gray-300'}`}>
            3
          </span>
          <span className="mr-2">تایید</span>
        </div>
      </div>

      {/* Step 1: Select Plan */}
      {step === 1 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activePlans.map((plan) => {
            const canAfford = totalCredit >= plan.price_agent
            return (
              <Card
                key={plan.id}
                className={`cursor-pointer transition-all ${
                  canAfford
                    ? 'hover:shadow-lg hover:border-primary-500 border-2 border-transparent'
                    : 'opacity-50 cursor-not-allowed'
                }`}
                onClick={() => canAfford && handleSelectPlan(plan)}
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
                    {Number(plan.price_agent).toLocaleString('fa-IR')} تومان
                  </p>
                  {!canAfford && (
                    <p className="text-xs text-red-500 mt-1">اعتبار کافی نیست</p>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Step 2: Enter Username */}
      {step === 2 && (
        <Card>
          <h3 className="text-lg font-bold mb-4">انتخاب نام کاربری Marzban</h3>
          <p className="text-sm text-gray-500 mb-4">
            نام کاربری باید منحصر به فرد باشد و فقط شامل حروف انگلیسی، اعداد و _ باشد.
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

      {/* Step 3: Confirm */}
      {step === 3 && (
        <Card>
          <h3 className="text-lg font-bold mb-6">تایید سفارش</h3>

          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg space-y-3 mb-6">
            <div className="flex justify-between">
              <span className="text-gray-500">پلن:</span>
              <span className="font-medium">{selectedPlan?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">مدت:</span>
              <span>{selectedPlan?.days} روز</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">حجم:</span>
              <span>{selectedPlan?.data_limit_gb} گیگابایت</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">نام کاربری:</span>
              <span className="font-mono" dir="ltr">{marzbanUsername}</span>
            </div>
            <div className="flex justify-between pt-3 border-t dark:border-gray-600">
              <span className="text-gray-500">مبلغ قابل پرداخت:</span>
              <span className="text-xl font-bold text-primary-600">
                {Number(selectedPlan?.price_agent || 0).toLocaleString('fa-IR')} تومان
              </span>
            </div>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg mb-6">
            <p className="text-sm text-yellow-700 dark:text-yellow-400">
              با تایید سفارش، مبلغ از کیف پول شما کسر می‌شود.
            </p>
          </div>

          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setStep(2)}>
              بازگشت
            </Button>
            <Button
              onClick={handleSubmit}
              loading={createOrderMutation.isLoading}
              disabled={wallet?.is_negative}
            >
              تایید و ساخت کاربر
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}

export default CreateUser
