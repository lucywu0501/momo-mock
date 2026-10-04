import { Link } from 'react-router'
export default function NotFoundPage() {
  return (
    <div className="py-24 text-center">
      <p className="text-6xl font-black text-momo">404</p>
      <p className="mt-2 text-gray-500">找不到這個頁面</p>
      <Link to="/" className="mt-4 inline-block text-momo underline">回首頁</Link>
    </div>
  )
}
