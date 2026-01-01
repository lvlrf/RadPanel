import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { agentsAPI } from '../../services/api'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Modal from '../../components/ui/Modal'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import toast from 'react-hot-toast'

function Agents() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isCreditOpen, setIsCreditOpen] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState(null)
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    first_name: '',
    last_name: '',
    phone: '',
    shop_name: '',
  })
  const [creditData, setCreditData] = useState({ amount: '', notes: '' })

  const { data, isLoading } = useQuery({
    queryKey: ['agents', page],
    queryFn: () => agentsAPI.list({ page, page_size: 20 }).then(res => res.data),
  })

  const createMutation = useMutation({
    mutationFn: (data) => agentsAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['agents'])
      toast.success('نماینده با موفقیت ایجاد شد')
      setIsCreateOpen(false)
      resetForm()
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'خطا در ایجاد نماینده')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => agentsAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['agents'])
      toast.success('نماینده با موفقیت ویرایش شد')
      setIsEditOpen(false)
      setSelectedAgent(null)
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'خطا در ویرایش نماینده')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => agentsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['agents'])
      toast.success('نماینده غیرفعال شد')
    },
  })

  const enableMutation = useMutation({
    mutationFn: (id) => agentsAPI.enable(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['agents'])
      toast.success('نماینده فعال شد')
    },
  })

  const creditMutation = useMutation({
    mutationFn: ({ id, data }) => agentsAPI.adjustCredit(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['agents'])
      toast.success('اعتبار با موفقیت تنظیم شد')
      setIsCreditOpen(false)
      setCreditData({ amount: '', notes: '' })
      setSelectedAgent(null)
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'خطا در تنظیم اعتبار')
    },
  })

  const resetForm = () => {
    setFormData({
      username: '',
      password: '',
      first_name: '',
      last_name: '',
      phone: '',
      shop_name: '',
    })
  }

  const handleCreate = (e) => {
    e.preventDefault()
    createMutation.mutate(formData)
  }

  const handleEdit = (e) => {
    e.preventDefault()
    const updateData = { ...formData }
    if (!updateData.password) delete updateData.password
    updateMutation.mutate({ id: selectedAgent.id, data: updateData })
  }

  const handleCreditSubmit = (e) => {
    e.preventDefault()
    creditMutation.mutate({
      id: selectedAgent.id,
      data: {
        amount: parseInt(creditData.amount),
        notes: creditData.notes,
      },
    })
  }

  const openEdit = (agent) => {
    setSelectedAgent(agent)
    setFormData({
      username: agent.username,
      password: '',
      first_name: agent.first_name || '',
      last_name: agent.last_name || '',
      phone: agent.phone || '',
      shop_name: agent.shop_name || '',
    })
    setIsEditOpen(true)
  }

  const openCredit = (agent) => {
    setSelectedAgent(agent)
    setCreditData({ amount: '', notes: '' })
    setIsCreditOpen(true)
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
          مدیریت نمایندگان
        </h1>
        <Button onClick={() => setIsCreateOpen(true)}>افزودن نماینده</Button>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b dark:border-gray-700">
                <th className="text-right py-3 px-4">نام کاربری</th>
                <th className="text-right py-3 px-4">نام</th>
                <th className="text-right py-3 px-4">فروشگاه</th>
                <th className="text-right py-3 px-4">اعتبار تایید شده</th>
                <th className="text-right py-3 px-4">اعتبار امانی</th>
                <th className="text-right py-3 px-4">وضعیت</th>
                <th className="text-right py-3 px-4">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {data?.agents?.map((agent) => (
                <tr key={agent.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="py-3 px-4">{agent.username}</td>
                  <td className="py-3 px-4">{agent.first_name} {agent.last_name}</td>
                  <td className="py-3 px-4">{agent.shop_name || '-'}</td>
                  <td className="py-3 px-4 text-green-600 font-medium">
                    {Number(agent.credit_confirmed).toLocaleString('fa-IR')}
                  </td>
                  <td className="py-3 px-4 text-yellow-600 font-medium">
                    {Number(agent.credit_pending).toLocaleString('fa-IR')}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded text-xs ${
                      agent.status === 'ACTIVE'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {agent.status === 'ACTIVE' ? 'فعال' : 'غیرفعال'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <Button size="sm" variant="secondary" onClick={() => openEdit(agent)}>
                        ویرایش
                      </Button>
                      <Button size="sm" variant="success" onClick={() => openCredit(agent)}>
                        اعتبار
                      </Button>
                      {agent.status === 'ACTIVE' ? (
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => deleteMutation.mutate(agent.id)}
                          loading={deleteMutation.isLoading}
                        >
                          غیرفعال
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="success"
                          onClick={() => enableMutation.mutate(agent.id)}
                          loading={enableMutation.isLoading}
                        >
                          فعال
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center mt-4 pt-4 border-t dark:border-gray-700">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            نمایش {data?.agents?.length} از {data?.total} نماینده
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
              disabled={data?.agents?.length < 20}
              onClick={() => setPage(p => p + 1)}
            >
              بعدی
            </Button>
          </div>
        </div>
      </Card>

      {/* Create Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="افزودن نماینده جدید"
        size="md"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="نام کاربری"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            required
            placeholder="username"
            dir="ltr"
          />
          <Input
            label="رمز عبور"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
            placeholder="********"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="نام"
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              placeholder="نام"
            />
            <Input
              label="نام خانوادگی"
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              placeholder="نام خانوادگی"
            />
          </div>
          <Input
            label="شماره تلفن"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="09123456789"
            dir="ltr"
          />
          <Input
            label="نام فروشگاه"
            value={formData.shop_name}
            onChange={(e) => setFormData({ ...formData, shop_name: e.target.value })}
            placeholder="نام فروشگاه"
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsCreateOpen(false)}>
              انصراف
            </Button>
            <Button type="submit" loading={createMutation.isLoading}>
              ایجاد نماینده
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="ویرایش نماینده"
        size="md"
      >
        <form onSubmit={handleEdit} className="space-y-4">
          <Input
            label="نام کاربری"
            value={formData.username}
            disabled
            dir="ltr"
          />
          <Input
            label="رمز عبور جدید (اختیاری)"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder="خالی بگذارید اگر نمی‌خواهید تغییر دهید"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="نام"
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
            />
            <Input
              label="نام خانوادگی"
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
            />
          </div>
          <Input
            label="شماره تلفن"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            dir="ltr"
          />
          <Input
            label="نام فروشگاه"
            value={formData.shop_name}
            onChange={(e) => setFormData({ ...formData, shop_name: e.target.value })}
          />
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

      {/* Credit Adjustment Modal */}
      <Modal
        isOpen={isCreditOpen}
        onClose={() => setIsCreditOpen(false)}
        title={`تنظیم اعتبار - ${selectedAgent?.shop_name || selectedAgent?.username}`}
        size="sm"
      >
        <form onSubmit={handleCreditSubmit} className="space-y-4">
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg space-y-2">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              اعتبار فعلی: <span className="font-bold text-green-600">{Number(selectedAgent?.credit_confirmed || 0).toLocaleString('fa-IR')}</span> تومان
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              اعتبار امانی: <span className="font-bold text-yellow-600">{Number(selectedAgent?.credit_pending || 0).toLocaleString('fa-IR')}</span> تومان
            </p>
          </div>
          <Input
            label="مبلغ (تومان)"
            type="number"
            value={creditData.amount}
            onChange={(e) => setCreditData({ ...creditData, amount: e.target.value })}
            required
            placeholder="عدد مثبت برای افزایش، منفی برای کاهش"
            dir="ltr"
          />
          <Input
            label="توضیحات"
            value={creditData.notes}
            onChange={(e) => setCreditData({ ...creditData, notes: e.target.value })}
            placeholder="دلیل تغییر اعتبار"
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsCreditOpen(false)}>
              انصراف
            </Button>
            <Button type="submit" loading={creditMutation.isLoading}>
              اعمال تغییرات
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default Agents
