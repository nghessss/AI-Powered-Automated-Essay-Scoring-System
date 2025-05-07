// pages/sessions.tsx

import { GetServerSideProps } from "next"
import Link from "next/link"

interface SessionsProps {
  sessionIds: string[]
  error?: string
}

export default function SessionsListPage({ sessionIds, error }: SessionsProps) {
  if (error) {
    return (
      <p className="text-red-600">
        Lỗi khi lấy danh sách: {error}
      </p>
    )
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-2xl font-semibold mb-4">Danh sách Sessions</h1>
      <ul className="list-disc pl-5 space-y-2">
        {sessionIds.map((id) => (
          <li key={id}>
            <Link
              href={`/session/${id}`}
              className="text-blue-600 hover:underline"
            >
              Session: {id}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

export const getServerSideProps: GetServerSideProps<SessionsProps> = async () => {
  try {
    const URL = process.env.NEXT_PUBLIC_API_URL
    const res = await fetch(URL+"/sessions")
    if (!res.ok) throw new Error(`Status ${res.status}`)
    const json = await res.json()
    return { props: { sessionIds: json.session_ids } }
  } catch (err: any) {
    return { props: { sessionIds: [], error: err.message } }
  }
}
