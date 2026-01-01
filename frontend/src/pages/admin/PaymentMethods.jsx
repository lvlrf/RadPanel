import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { paymentMethodsAPI } from '../../services/api'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Modal from '../../components/ui/Modal'
import Select from '../../components/ui/Select'
import Textarea from '../../components/ui/Textarea'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import toast from 'react-hot-toast'

const PAYMENT_TYPES = {
  CARD: 'کارت بانکی',
  SHEBA: 'شماره شبا',
  CRYPTO: 'ارز دیجیتال',
}

function PaymentMethods() {
  const queryClient = useQueryClient()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [selectedMethod, setSelectedMethod] = useState(null)
  const [formData, setFormData] = useState({
    alias: '',
    type: 'CARD',
    is_active: true,
    config: {},
  })
  const [cardNumbers, setCardNumbers] = useState([''])
  const [shebaNumber, setShebaNumber] = useState('')
  const [cryptoConfig, setCryptoConfig] = useState({ network: '', address: '' })

  const { data, isLoading } = useQuery({
    queryKey: ['payment-methods-admin'],
    queryFn: () => paymentMethodsAPI.listAdmin().then(res => res.data),
  })

  const createMutation = useMutation({
    mutationFn: (data) => paymentMethodsAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['payment-methods-admin'])
      toast.success('روش پرداخت با موفقیت ایجاد شد')
      setIsCreateOpen(false)
      resetForm()
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'خطا در ایجاد روش پرداخت')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => paymentMethodsAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['payment-methods-admin'])
      toast.success('روش پرداخت با موفقیت ویرایش شد')
      setIsEditOpen(false)
      setSelectedMethod(null)
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'خطا در ویرایش روش پرداخت')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => paymentMethodsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['payment-methods-admin'])
      toast.success('روش پرداخت با موفقیت حذف شد')
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'خطا در حذف روش پرداخت')
    },
  })

  const resetForm = () => {
    setFormData({
      alias: '',
      type: 'CARD',
      is_active: true,
      config: {},
    })
    setCardNumbers([''])
    setShebaNumber('')
    setCryptoConfig({ network: '', address: '' })
  }

  const buildConfig = () => {
    switch (formData.type) {
      case 'CARD':
        return { cards: cardNumbers.filter(c => c.trim()) }
      case 'SHEBA':
        return { sheba: shebaNumber }
      case 'CRYPTO':
        return cryptoConfig
      default:
        return {}
    }
  }

  const handleCreate = (e) => {
    e.preventDefault()
    createMutation.mutate({
      ...formData,
      config: buildConfig(),
    })
  }

  const handleEdit = (e) => {
    e.preventDefault()
    updateMutation.mutate({
      id: selectedMethod.id,
      data: {
        ...formData,
        config: buildConfig(),
      },
    })
  }

  const openEdit = (method) => {
    setSelectedMethod(method)
    setFormData({
      alias: method.alias,
      type: method.type,
      is_active: method.is_active,
      config: method.config,
    })
    // Set type-specific state
    if (method.type === 'CARD' && method.config?.cards) {
      setCardNumbers(method.config.cards.length > 0 ? method.config.cards : [''])
    } else if (method.type === 'SHEBA' && method.config?.sheba) {
      setShebaNumber(method.config.sheba)
    } else if (method.type === 'CRYPTO') {
      setCryptoConfig({
        network: method.config?.network || '',
        address: method.config?.address || '',
      })
    }
    setIsEditOpen(true)
  }

  const handleDelete = (method) => {
    if (window.confirm(`آیا از حذف "${method.alias}" اطمینان دارید؟`)) {
      deleteMutation.mutate(method.id)
    }
  }

  const addCardNumber = () => {
    setCardNumbers([...cardNumbers, ''])
  }

  const removeCardNumber = (index) => {
    setCardNumbers(cardNumbers.filter((_, i) => i !== index))
  }

  const updateCardNumber = (index, value) => {
    const newCards = [...cardNumbers]
    newCards[index] = value
    setCardNumbers(newCards)
  }

  const renderConfigFields = () => {
    switch (formData.type) {
      case 'CARD':
        return (
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              شماره کارت‌ها (برای انتخاب تصادفی)
            </label>
            {cardNumbers.map((card, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={card}
                  onChange={(e) => updateCardNumber(index, e.target.value)}
                  placeholder="6037-XXXX-XXXX-XXXX"
                  dir="ltr"
                  className="flex-1"
                />
                {cardNumbers.length > 1 && (
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => removeCardNumber(index)}
                  >
                    حذف
                  </Button>
                )}
              </div>
            ))}
            <Button type="button" variant="secondary" size="sm" onClick={addCardNumber}>
              افزودن کارت
            </Button>
          </div>
        )
      case 'SHEBA':
        return (
          <Input
            label="شماره شبا"
            value={shebaNumber}
            onChange={(e) => setShebaNumber(e.target.value)}
            placeholder="IR-XXXX-XXXX-XXXX-XXXX-XXXX-XX"
            dir="ltr"
          />
        )
      case 'CRYPTO':
        return (
          <div className="space-y-4">
            <Input
              label="شبکه"
              value={cryptoConfig.network}
              onChange={(e) => setCryptoConfig({ ...cryptoConfig, network: e.target.value })}
              placeholder="TRC20, ERC20, BEP20"
              dir="ltr"
            />
            <Textarea
              label="آدرس کیف پول"
              value={cryptoConfig.address}
              onChange={(e) => setCryptoConfig({ ...cryptoConfig, address: e.target.value })}
              placeholder="آدرس کیف پول..."
              dir="ltr"
              rows={2}
            />
          </div>
        )
      default:
        return null
    }
  }

  const renderConfigPreview = (method) => {
    switch (method.type) {
      case 'CARD':
        return method.config?.cards?.map((card, i) => (
          <p key={i} className="text-sm text-gray-600 dark:text-gray-400 font-mono" dir="ltr">
            {card}
          </p>
        ))
      case 'SHEBA':
        return (
          <p className="text-sm text-gray-600 dark:text-gray-400 font-mono" dir="ltr">
            {method.config?.sheba}
          </p>
        )
      case 'CRYPTO':
        return (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <p>شبکه: {method.config?.network}</p>
            <p className="font-mono text-xs break-all" dir="ltr">{method.config?.address}</p>
          </div>
        )
      default:
        return null
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
          روش‌های پرداخت
        </h1>
        <Button onClick={() => { resetForm(); setIsCreateOpen(true) }}>
          افزودن روش پرداخت
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data?.payment_methods?.map((method) => (
          <Card key={method.id}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {method.alias}
                </h3>
                <span className="text-sm text-gray-500">{PAYMENT_TYPES[method.type]}</span>
              </div>
              <span className={`px-2 py-1 rounded text-xs ${
                method.is_active
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {method.is_active ? 'فعال' : 'غیرفعال'}
              </span>
            </div>

            <div className="space-y-2 mb-4">
              {renderConfigPreview(method)}
            </div>

            <div className="flex gap-2 pt-4 border-t dark:border-gray-700">
              <Button
                size="sm"
                variant="secondary"
                className="flex-1"
                onClick={() => openEdit(method)}
              >
                ویرایش
              </Button>
              <Button
                size="sm"
                variant="danger"
                className="flex-1"
                onClick={() => handleDelete(method)}
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
        title="افزودن روش پرداخت"
        size="md"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="نام نمایشی"
            value={formData.alias}
            onChange={(e) => setFormData({ ...formData, alias: e.target.value })}
            required
            placeholder="مثال: کارت ملی، USDT TRC20"
          />
          <Select
            label="نوع پرداخت"
            value={formData.type}
            onChange={(e) => {
              setFormData({ ...formData, type: e.target.value })
              setCardNumbers([''])
              setShebaNumber('')
              setCryptoConfig({ network: '', address: '' })
            }}
          >
            <option value="CARD">کارت بانکی</option>
            <option value="SHEBA">شماره شبا</option>
            <option value="CRYPTO">ارز دیجیتال</option>
          </Select>

          {renderConfigFields()}

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="rounded border-gray-300"
            />
            <label htmlFor="is_active" className="text-sm text-gray-700 dark:text-gray-300">
              فعال
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsCreateOpen(false)}>
              انصراف
            </Button>
            <Button type="submit" loading={createMutation.isLoading}>
              ایجاد روش پرداخت
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="ویرایش روش پرداخت"
        size="md"
      >
        <form onSubmit={handleEdit} className="space-y-4">
          <Input
            label="نام نمایشی"
            value={formData.alias}
            onChange={(e) => setFormData({ ...formData, alias: e.target.value })}
            required
          />
          <Select
            label="نوع پرداخت"
            value={formData.type}
            onChange={(e) => {
              setFormData({ ...formData, type: e.target.value })
              setCardNumbers([''])
              setShebaNumber('')
              setCryptoConfig({ network: '', address: '' })
            }}
          >
            <option value="CARD">کارت بانکی</option>
            <option value="SHEBA">شماره شبا</option>
            <option value="CRYPTO">ارز دیجیتال</option>
          </Select>

          {renderConfigFields()}

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active_edit"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="rounded border-gray-300"
            />
            <label htmlFor="is_active_edit" className="text-sm text-gray-700 dark:text-gray-300">
              فعال
            </label>
          </div>

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

export default PaymentMethods
