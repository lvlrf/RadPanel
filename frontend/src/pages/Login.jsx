import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuth } from '../hooks/useAuth'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Card from '../components/ui/Card'

function Login() {
  const { login, isAuthenticated, user } = useAuth()
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm()

  // Redirect if already logged in
  if (isAuthenticated) {
    if (user.role === 'ADMIN') return <Navigate to="/admin" replace />
    if (user.role === 'AGENT') return <Navigate to="/agent" replace />
    return <Navigate to="/user" replace />
  }

  const onSubmit = async (data) => {
    setLoading(true)
    await login(data.username, data.password)
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <Card className="w-full max-w-md">
        <Card.Header>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-primary-600 mb-2">RAD Panel</h1>
            <p className="text-gray-600 dark:text-gray-400">ورود به پنل مدیریت</p>
          </div>
        </Card.Header>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="نام کاربری"
            placeholder="نام کاربری خود را وارد کنید"
            error={errors.username?.message}
            {...register('username', {
              required: 'نام کاربری الزامی است',
              minLength: { value: 3, message: 'حداقل 3 کاراکتر' }
            })}
          />

          <Input
            label="رمز عبور"
            type="password"
            placeholder="رمز عبور خود را وارد کنید"
            error={errors.password?.message}
            {...register('password', {
              required: 'رمز عبور الزامی است',
              minLength: { value: 6, message: 'حداقل 6 کاراکتر' }
            })}
          />

          <Button
            type="submit"
            loading={loading}
            className="w-full"
            size="lg"
          >
            ورود
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            حساب کاربری ندارید؟{' '}
            <Link to="/register" className="text-primary-600 hover:underline">
              ثبت‌نام کنید
            </Link>
          </p>
        </div>
      </Card>
    </div>
  )
}

export default Login
