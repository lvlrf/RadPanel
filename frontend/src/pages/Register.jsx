import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuth } from '../hooks/useAuth'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Card from '../components/ui/Card'

function Register() {
  const { register: registerUser, isAuthenticated } = useAuth()
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, watch, formState: { errors } } = useForm()

  // Redirect if already logged in
  if (isAuthenticated) {
    return <Navigate to="/user" replace />
  }

  const onSubmit = async (data) => {
    setLoading(true)
    await registerUser({
      username: data.username,
      email: data.email || null,
      password: data.password,
      phone: data.phone || null
    })
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <Card className="w-full max-w-md">
        <Card.Header>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-primary-600 mb-2">RAD Panel</h1>
            <p className="text-gray-600 dark:text-gray-400">ثبت‌نام کاربر جدید</p>
          </div>
        </Card.Header>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="نام کاربری"
            placeholder="نام کاربری دلخواه"
            error={errors.username?.message}
            {...register('username', {
              required: 'نام کاربری الزامی است',
              minLength: { value: 3, message: 'حداقل 3 کاراکتر' },
              pattern: { value: /^[a-zA-Z0-9_]+$/, message: 'فقط حروف انگلیسی، اعداد و _' }
            })}
          />

          <Input
            label="ایمیل (اختیاری)"
            type="email"
            placeholder="example@email.com"
            error={errors.email?.message}
            {...register('email', {
              pattern: { value: /^\S+@\S+$/i, message: 'ایمیل نامعتبر است' }
            })}
          />

          <Input
            label="شماره موبایل (اختیاری)"
            placeholder="09123456789"
            error={errors.phone?.message}
            {...register('phone', {
              pattern: { value: /^09\d{9}$/, message: 'شماره موبایل نامعتبر' }
            })}
          />

          <Input
            label="رمز عبور"
            type="password"
            placeholder="حداقل 6 کاراکتر"
            error={errors.password?.message}
            {...register('password', {
              required: 'رمز عبور الزامی است',
              minLength: { value: 6, message: 'حداقل 6 کاراکتر' }
            })}
          />

          <Input
            label="تکرار رمز عبور"
            type="password"
            placeholder="رمز عبور را تکرار کنید"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword', {
              required: 'تکرار رمز عبور الزامی است',
              validate: value => value === watch('password') || 'رمز عبور مطابقت ندارد'
            })}
          />

          <Button
            type="submit"
            loading={loading}
            className="w-full"
            size="lg"
          >
            ثبت‌نام
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            حساب کاربری دارید؟{' '}
            <Link to="/login" className="text-primary-600 hover:underline">
              وارد شوید
            </Link>
          </p>
        </div>
      </Card>
    </div>
  )
}

export default Register
