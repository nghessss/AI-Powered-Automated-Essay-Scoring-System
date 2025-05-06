// pages/session/[session_id].tsx

import React from "react"
import { GetServerSideProps } from "next"
import Link from "next/link"
import HtmlContentDisplay from "@/components/html-content-display"
import WordUsageAnalysis from "@/components/word-usage-analysis"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Info, BarChart3, CheckCircle, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"

// --- Dữ liệu trả về từ API ---
type CriterionKey =
  | "task_response"
  | "coherence_and_cohesion"
  | "lexical_resource"
  | "grammatical_range_and_accuracy"

interface SessionJSON {
  session_id: string
  question: string
  answer: string
  feedback: {
    overall_score: number
    evaluation_feedback: {
      criteria: Record<CriterionKey, { score: number; details: string[] }>
    }
    constructive_feedback: {
      criteria: Record<
        CriterionKey,
        {
          score: number
          strengths: string[]
          areas_for_improvement: string[]
          recommendations: string[]
        }
      >
    }
  }
  statistics: Parameters<typeof WordUsageAnalysis>[0]["analysis"]
  annotated_essay: string
  created_at: string
}

// --- Props cho component sau khi fetch ---
interface SessionPageProps {
  data?: SessionJSON
  error?: string
  notFound?: boolean
  // session_id giờ được lấy trong getServerSideProps, nhưng không buộc phải dùng trong UI
  session_id: string
}

export default function SessionPage(props: SessionPageProps) {
  const { data, error, notFound, session_id } = props

  if (notFound) {
    return (
      <div className="p-8 text-center text-red-600">
        Session <code>{session_id}</code> không tồn tại.
        <Link href="/" className="block mt-4 text-blue-600 hover:underline">
          ← Back
        </Link>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-600">
        Lỗi: {error}
      </div>
    )
  }

  if (!data) {
    return <div className="p-8 text-center">Loading…</div>
  }

  // Xây dựng object scores và hàm giúp lấy feedback theo tiêu chí
  const evalC = data.feedback.evaluation_feedback.criteria
  const consC = data.feedback.constructive_feedback.criteria
  const scores = {
    taskAchievement: consC.task_response.score,
    coherenceCohesion: consC.coherence_and_cohesion.score,
    lexicalResource: consC.lexical_resource.score,
    grammaticalRange: consC.grammatical_range_and_accuracy.score,
  }
  const overall = data.feedback.overall_score.toFixed(1)
  const keyMap: Record<keyof typeof scores, CriterionKey> = {
    taskAchievement: "task_response",
    coherenceCohesion: "coherence_and_cohesion",
    lexicalResource: "lexical_resource",
    grammaticalRange: "grammatical_range_and_accuracy",
  }
  const labelMap = {
    taskAchievement: "Task Achievement",
    coherenceCohesion: "Coherence & Cohesion",
    lexicalResource: "Lexical Resource",
    grammaticalRange: "Grammatical Range",
  } as const
  const criteriaKeys = Object.keys(scores) as Array<keyof typeof scores>

  function getFeedback(
    crit: keyof typeof scores,
    type: "strengths" | "evaluation" | "areas_for_improvement"
  ): string[] {
    const jsonKey = keyMap[crit]
    if (type === "evaluation") {
      return evalC[jsonKey].details.length
        ? evalC[jsonKey].details
        : ["No evaluation feedback"]
    }
    const block = (consC as any)[jsonKey]
    return type === "strengths"
      ? block.strengths
      : type === "areas_for_improvement"
      ? block.areas_for_improvement
      : []
  }

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-8">
      {/* Back to home */}
      <Button asChild variant="ghost" className="mb-4">
        <Link href="/">← Back</Link>
      </Button>
      {/* 1. Task 2 Question */}
      <Card>
        <CardHeader>
          <CardTitle>Task 2 Question</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-3 bg-muted rounded-md">
            <p>{data.question}</p>
          </div>
        </CardContent>
      </Card>

      {/* 2. Tabs: Essay & Word Usage Analysis */}
      <Tabs defaultValue="detailed-analysis" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="detailed-analysis">
            <Info className="h-4 w-4 mr-2" />
            Your Essay
          </TabsTrigger>
          <TabsTrigger value="word-usage">
            <BarChart3 className="h-4 w-4 mr-2" />
            Word Usage Analysis
          </TabsTrigger>
        </TabsList>

        <TabsContent value="detailed-analysis" className="mt-4">
          <HtmlContentDisplay
            htmlContent={data.annotated_essay}
            title="Your essay with suggestions"
          />
        </TabsContent>
        <TabsContent value="word-usage" className="mt-4">
          <WordUsageAnalysis analysis={data.statistics} />
        </TabsContent>
      </Tabs>

      {/* 3. Your IELTS Score */}
      <Card>
        <CardHeader>
          <CardTitle>Your IELTS Score</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-center">
            <div className="w-32 h-32 bg-green-600 text-white rounded-lg flex flex-col items-center justify-center">
              <div className="text-sm uppercase font-semibold">Overall Band</div>
              <div className="text-4xl font-bold">{overall}</div>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(scores).map(([crit, val]) => (
              <div key={crit} className="bg-gray-100 rounded-lg p-4 text-center">
                <div className="text-xs uppercase font-semibold mb-1 truncate">
                  {labelMap[crit as keyof typeof labelMap]}
                </div>
                <div className="text-2xl font-bold">{(val as number).toFixed(1)}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 4. Detailed Feedback */}
      <div className="space-y-8">
        {criteriaKeys.map((crit) => (
          <div key={crit} className="space-y-4">
            {/* Criterion Title */}
            <h3 className="text-lg font-semibold">{labelMap[crit]}</h3>
            {/* Progress bar */}
            <div className="flex items-center gap-2 mt-1">
              {/* Score text */}
              <span className="text-sm font-medium">
                Score: {scores[crit].toFixed(1)}
              </span>
              {/* Empty track */}
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden flex-1">
                {/* Filled portion */}
                <div
                  className="h-full bg-primary"
                  style={{
                    width: `${Math.max(0, Math.min(100, ((scores[crit] - 3) / 6) * 100))}%`,
                  }}
                />
              </div>
            </div>

            {/* Three-column grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Strengths Box */}
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-green-100 p-3 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <h4 className="font-medium">Strengths</h4>
                </div>
                <div className="p-3 bg-green-50 h-full">
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {getFeedback(crit, "strengths").map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Evaluation Box */}
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-blue-100 p-3 flex items-center gap-2">
                  <Info className="h-4 w-4 text-blue-600" />
                  <h4 className="font-medium">Evaluation</h4>
                </div>
                <div className="p-3 bg-blue-50 h-full">
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {getFeedback(crit, "evaluation").map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Areas for Improvement Box */}
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-amber-100 p-3 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <h4 className="font-medium">Areas for Improvement</h4>
                </div>
                <div className="p-3 bg-amber-50 h-full">
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {getFeedback(crit, "areas_for_improvement").map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Separator giữa các tiêu chí */}
            {crit !== "grammaticalRange" && <Separator className="my-6" />}
          </div>
        ))}
      </div>
    </div>
  )
}

// --------- Lấy session_id & data qua SSR ---------
export const getServerSideProps: GetServerSideProps<SessionPageProps> = async ({
  params,
}) => {
  const session_id = params?.session_id as string  // <-- Chỗ sửa: lấy ID từ params ở đây
  const URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"
  const res = await fetch(`${URL}/session/${session_id}`)
  if (res.status === 404) {
    return { props: { session_id, notFound: true } }
  }
  if (!res.ok) {
    return { props: { session_id, error: `Status ${res.status}` } }
  }
  const data: SessionJSON = await res.json()
  return { props: { session_id, data } }
}
