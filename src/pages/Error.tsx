import { Link } from 'react-router-dom'
import { Compass, ArrowLeft, RefreshCw } from 'lucide-react'
import { Button, Card } from '../components/ui'

export function NotFound() {
  return (
    <div className="flex h-full items-center justify-center p-6">
      <Card className="w-full max-w-[460px] p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-subtle text-t3">
          <Compass size={22} />
        </div>
        <div className="num text-[40px] font-medium leading-none tracking-tight text-t1">404</div>
        <p className="mt-2 text-sm text-t1">页面不存在</p>
        <p className="mt-1 text-xs leading-5 text-t3">
          链接可能已失效，或该内容已被移动。可以返回工作台，或从视频资产库重新进入。
        </p>
        <div className="mt-5 flex justify-center gap-2">
          <Link to="/dashboard">
            <Button icon={<ArrowLeft size={13} />}>返回工作台</Button>
          </Link>
          <Link to="/videos">
            <Button variant="primary">视频资产库</Button>
          </Link>
        </div>
      </Card>
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="flex h-full items-center justify-center p-6">
      <Card className="w-full max-w-[460px] p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-danger/10 text-danger">
          <RefreshCw size={20} />
        </div>
        <p className="text-sm text-t1">页面加载失败</p>
        <p className="mt-1 text-xs leading-5 text-t3">{message ?? '渲染过程中出现异常，请重试或返回上一页。'}</p>
        <div className="mt-5 flex justify-center gap-2">
          <Button onClick={onRetry ?? (() => window.location.reload())}>重新加载</Button>
          <Link to="/dashboard">
            <Button variant="primary">返回工作台</Button>
          </Link>
        </div>
      </Card>
    </div>
  )
}
