import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { agentsAPI } from '../../services/api'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import toast from 'react-hot-toast'

function Agents() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['agents', page],
    queryFn: () => agentsAPI.list({ page, page_size: 20 }).then(res => res.data),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => agentsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['agents'])
      toast.success('نماینده غیرفعال شد')
    },
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
          مدیریت نمایندگان
        </h1>
        <Button>افزودن نماینده</Button>
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
                  <td className="py-3 px-4 text-green-600">
                    {Number(agent.credit_confirmed).toLocaleString('fa-IR')}
                  </td>
                  <td className="py-3 px-4 text-yellow-600">
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
                      <Button size="sm" variant="secondary">ویرایش</Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => deleteMutation.mutate(agent.id)}
                        loading={deleteMutation.isLoading}
                      >
                        غیرفعال
                      </Button>
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
    </div>
  )
}

export default Agents
