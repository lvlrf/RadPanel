import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'

function PaymentMethods() {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          روش‌های پرداخت
        </h1>
        <Button>افزودن روش پرداخت</Button>
      </div>

      <Card>
        <p className="text-gray-600 dark:text-gray-400">
          این بخش در حال توسعه است...
        </p>
      </Card>
    </div>
  )
}

export default PaymentMethods
