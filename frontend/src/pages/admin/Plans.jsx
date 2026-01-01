import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { plansAPI } from '../../services/api'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Modal from '../../components/ui/Modal'
import Select from '../../components/ui/Select'
import Textarea from '../../components/ui/Textarea'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import toast from 'react-hot-toast'

function Plans() {
  const queryClient = useQueryClient()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    days: '',
    data_limit_gb: '',
    price_public: '',
    price_agent: '',
    description: '',
    status: 'ACTIVE',
  })

  const { data, isLoading } = useQuery({
    queryKey: ['plans'],
    queryFn: () => plansAPI.list().then(res => res.data),
  })

  const createMutation = useMutation({
    mutationFn: (data) => plansAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['plans'])
      toast.success('پلن با موفقیت ایجاد شد')
      setIsCreateOpen(false)
      resetForm()
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'خطا در ایجاد پلن')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => plansAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['plans'])
      toast.success('پلن با موفقیت ویرایش شد')
      setIsEditOpen(false)
      setSelectedPlan(null)
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'خطا در ویرایش پلن')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => plansAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['plans'])
      toast.success('پلن با موفقیت حذف شد')
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'خطا در حذف پلن')
    },
  })

  const resetForm = () => {
    setFormData({
      name: '',
      days: '',
      data_limit_gb: '',
      price_public: '',
      price_agent: '',
      description: '',
      status: 'ACTIVE',
    })
  }

  const handleCreate = (e) => {
    e.preventDefault()
    createMutation.mutate({
      ...formData,
      days: parseInt(formData.days),
      data_limit_gb: parseInt(formData.data_limit_gb),
      price_public: parseInt(formData.price_public),
      price_agent: parseInt(formData.price_agent),
    })
  }

  const handleEdit = (e) => {
    e.preventDefault()
    updateMutation.mutate({
      id: selectedPlan.id,
      data: {
        ...formData,
        days: parseInt(formData.days),
        data_limit_gb: parseInt(formData.data_limit_gb),
        price_public: parseInt(formData.price_public),
        price_agent: parseInt(formData.price_agent),
      },
    })
  }

  const openEdit = (plan) => {
    setSelectedPlan(plan)
    setFormData({
      name: plan.name,
      days: plan.days.toString(),
      data_limit_gb: plan.data_limit_gb.toString(),
      price_public: plan.price_public.toString(),
      price_agent: plan.price_agent.toString(),
      description: plan.description || '',
      status: plan.status,
    })
    setIsEditOpen(true)
  }

  const handleDelete = (plan) => {
    if (window.confirm(`آیا از حذف پلن "${plan.name}" اطمینان دارید؟`)) {
      deleteMutation.mutate(plan.id)
    }
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
          مدیریت پلن‌ها
        </h1>
        <Button onClick={() => setIsCreateOpen(true)}>افزودن پلن</Button>
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
              {plan.description && (
                <p className="pt-2 text-xs">{plan.description}</p>
              )}
            </div>

            <div className="flex gap-2 mt-4 pt-4 border-t dark:border-gray-700">
              <Button
                size="sm"
                variant="secondary"
                className="flex-1"
                onClick={() => openEdit(plan)}
              >
                ویرایش
              </Button>
              <Button
                size="sm"
                variant="danger"
                className="flex-1"
                onClick={() => handleDelete(plan)}
                loading={deleteMutation.isLoading}
              >
                حذف
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="افزودن پلن جدید"
        size="md"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="نام پلن"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            placeholder="مثال: پلن ۳۰ روزه"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="مدت (روز)"
              type="number"
              value={formData.days}
              onChange={(e) => setFormData({ ...formData, days: e.target.value })}
              required
              placeholder="30"
              dir="ltr"
            />
            <Input
              label="حجم (گیگابایت)"
              type="number"
              value={formData.data_limit_gb}
              onChange={(e) => setFormData({ ...formData, data_limit_gb: e.target.value })}
              required
              placeholder="50"
              dir="ltr"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="قیمت عمومی (تومان)"
              type="number"
              value={formData.price_public}
              onChange={(e) => setFormData({ ...formData, price_public: e.target.value })}
              required
              placeholder="150000"
              dir="ltr"
            />
            <Input
              label="قیمت نماینده (تومان)"
              type="number"
              value={formData.price_agent}
              onChange={(e) => setFormData({ ...formData, price_agent: e.target.value })}
              required
              placeholder="100000"
              dir="ltr"
            />
          </div>
          <Textarea
            label="توضیحات (اختیاری)"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="توضیحات پلن..."
            rows={2}
          />
          <Select
            label="وضعیت"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
          >
            <option value="ACTIVE">فعال</option>
            <option value="INACTIVE">غیرفعال</option>
          </Select>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsCreateOpen(false)}>
              انصراف
            </Button>
            <Button type="submit" loading={createMutation.isLoading}>
              ایجاد پلن
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="ویرایش پلن"
        size="md"
      >
        <form onSubmit={handleEdit} className="space-y-4">
          <Input
            label="نام پلن"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="مدت (روز)"
              type="number"
              value={formData.days}
              onChange={(e) => setFormData({ ...formData, days: e.target.value })}
              required
              dir="ltr"
            />
            <Input
              label="حجم (گیگابایت)"
              type="number"
              value={formData.data_limit_gb}
              onChange={(e) => setFormData({ ...formData, data_limit_gb: e.target.value })}
              required
              dir="ltr"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="قیمت عمومی (تومان)"
              type="number"
              value={formData.price_public}
              onChange={(e) => setFormData({ ...formData, price_public: e.target.value })}
              required
              dir="ltr"
            />
            <Input
              label="قیمت نماینده (تومان)"
              type="number"
              value={formData.price_agent}
              onChange={(e) => setFormData({ ...formData, price_agent: e.target.value })}
              required
              dir="ltr"
            />
          </div>
          <Textarea
            label="توضیحات (اختیاری)"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={2}
          />
          <Select
            label="وضعیت"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
          >
            <option value="ACTIVE">فعال</option>
            <option value="INACTIVE">غیرفعال</option>
          </Select>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsEditOpen(false)}>
              انصراف
            </Button>
            <Button type="submit" loading={updateMutation.isLoading}>
              ذخیره تغییرات
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default Plans
