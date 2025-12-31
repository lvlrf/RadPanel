import { useState } from 'react'
import { reportsAPI } from '../../services/api'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import toast from 'react-hot-toast'

function Reports() {
  const [loading, setLoading] = useState(false)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const handleExport = async () => {
    setLoading(true)
    try {
      const response = await reportsAPI.export({
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      })

      // Download file
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `RAD_Report_${new Date().toISOString().split('T')[0]}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()

      toast.success('گزارش دانلود شد')
    } catch (error) {
      toast.error('خطا در دانلود گزارش')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        گزارشات و خروجی اکسل
      </h1>

      <Card>
        <Card.Header>
          <Card.Title>فیلترهای گزارش</Card.Title>
        </Card.Header>
        <Card.Content>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Input
              label="از تاریخ"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
            <Input
              label="تا تاریخ"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
            <div className="flex items-end">
              <Button
                onClick={handleExport}
                loading={loading}
                className="w-full"
              >
                دانلود گزارش Excel
              </Button>
            </div>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-400">
            با کلیک روی دکمه بالا، تمامی تراکنش‌های مالی در بازه زمانی انتخاب شده به فرمت Excel دانلود می‌شود.
          </p>
        </Card.Content>
      </Card>
    </div>
  )
}

export default Reports
