import { useQuery } from '@tanstack/react-query'
import { plansAPI } from '../../services/api'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

function Plans() {
  const { data, isLoading } = useQuery({
    queryKey: ['plans'],
    queryFn: () => plansAPI.list().then(res => res.data),
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
          مدیریت پلن‌ها
        </h1>
        <Button>افزودن پلن</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data?.plans?.map((plan) => (
          <Card key={plan.id}>
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {plan.name}
              </h3>
              <span className={`px-2 py-1 rounded text-xs ${
                plan.status === 'ACTIVE'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {plan.status === 'ACTIVE' ? 'فعال' : 'غیرفعال'}
              </span>
            </div>

            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <p><span className="font-medium">مدت:</span> {plan.days} روز</p>
              <p><span className="font-medium">حجم:</span> {plan.data_limit_gb} گیگابایت</p>
              <p>
                <span className="font-medium">قیمت عمومی:</span>{' '}
                <span className="text-lg font-bold text-primary-600">
                  {Number(plan.price_public).toLocaleString('fa-IR')}
                </span>{' '}
                تومان
              </p>
              <p>
                <span className="font-medium">قیمت نماینده:</span>{' '}
                <span className="text-lg font-bold text-green-600">
                  {Number(plan.price_agent).toLocaleString('fa-IR')}
                </span>{' '}
                تومان
              </p>
            </div>

            <div className="flex gap-2 mt-4 pt-4 border-t dark:border-gray-700">
              <Button size="sm" variant="secondary" className="flex-1">ویرایش</Button>
              <Button size="sm" variant="danger" className="flex-1">حذف</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default Plans
