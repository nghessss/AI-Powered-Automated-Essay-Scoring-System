"use client"

import { useState, useEffect } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Lightbulb, CheckCircle, Info, AlertTriangle, Loader2 } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import dynamic from "next/dynamic"

// Import HtmlContentDisplay with dynamic import to prevent SSR issues
const HtmlContentDisplay = dynamic(() => import("@/components/html-content-display"), { ssr: false })

export default function IeltsTask2Grader() {
  const [text, setText] = useState("")
  const [question, setQuestion] = useState("")
  const [isGraded, setIsGraded] = useState(false)
  const [scores, setScores] = useState({
    taskAchievement: 6,
    coherenceCohesion: 6,
    lexicalResource: 6,
    grammaticalRange: 6,
  })
  const [feedbackData, setFeedbackData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Use mock data for testing
  const useMockData = () => {
    // Create mock feedback data
    const mockFeedback = {
      overall: 6.5,
      task_response: {
        score: 6,
        evaluation_feedback: [
          "You have addressed the main aspects of the task.",
          "Your position is clear but could be more fully developed.",
        ],
        constructive_feedback: {
          strengths: [
            "You have a clear introduction that presents the topic.",
            "You have included relevant examples to support your points.",
          ],
          areas_for_improvement: [
            "Try to address all parts of the prompt more equally.",
            "Develop your conclusion more fully to summarize your arguments.",
          ],
          recommendations: [
            "Include a clearer thesis statement in your introduction.",
            "Make sure to fully address all parts of the prompt.",
          ],
        },
      },
      coherence_and_cohesion: {
        score: 7,
        evaluation_feedback: [
          "Your essay has a clear overall progression.",
          "You use cohesive devices effectively in most cases.",
        ],
        constructive_feedback: {
          strengths: [
            "Your paragraphs have clear central topics.",
            "You use a range of cohesive devices appropriately.",
          ],
          areas_for_improvement: [
            "Some paragraphs could be better connected to improve flow.",
            "Avoid overusing certain linking words.",
          ],
          recommendations: [
            "Use a wider variety of cohesive devices.",
            "Ensure each paragraph has a clear topic sentence.",
          ],
        },
      },
      lexical_resource: {
        score: 6,
        evaluation_feedback: [
          "You use an adequate range of vocabulary for the task.",
          "There are some errors in word choice and collocation.",
        ],
        constructive_feedback: {
          strengths: [
            "You attempt to use some less common vocabulary items.",
            "Your vocabulary is generally relevant to the topic.",
          ],
          areas_for_improvement: [
            "Work on using more precise vocabulary.",
            "Reduce errors in word form and collocation.",
          ],
          recommendations: [
            "Learn synonyms for commonly used words.",
            "Practice using academic vocabulary in context.",
          ],
        },
      },
      grammatical_range_and_accuracy: {
        score: 7,
        evaluation_feedback: [
          "You use a mix of simple and complex sentence structures.",
          "There are some errors in grammar but they rarely impede communication.",
        ],
        constructive_feedback: {
          strengths: ["You use a variety of complex structures.", "Most of your sentences are error-free."],
          areas_for_improvement: [
            "Pay attention to subject-verb agreement in complex sentences.",
            "Be careful with article usage.",
          ],
          recommendations: [
            "Practice using a wider range of complex structures.",
            "Review common grammar errors in your writing.",
          ],
        },
      },
    }

    // Update state with mock data
    setScores({
      taskAchievement: mockFeedback.task_response.score,
      coherenceCohesion: mockFeedback.coherence_and_cohesion.score,
      lexicalResource: mockFeedback.lexical_resource.score,
      grammaticalRange: mockFeedback.grammatical_range_and_accuracy.score,
    })
    setFeedbackData(mockFeedback)
  }

  useEffect(() => {
    if (isGraded) return // Only use mock data if not already graded
    useMockData()
  }, [isGraded])

  const handleGrade = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log("Question:", question)
      console.log("Essay:", text)
      const response = await fetch("/api/grade-essay", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: question,
          answer: text,
        }),
      })

      if (!response.ok) {
        const contentType = response.headers.get("content-type")
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json()
          throw new Error(errorData.error || `Server error: ${response.status}`)
        } else {
          throw new Error(`Server error: ${response.status} ${response.statusText}`)
        }
      }

      let data
      try {
        const text = await response.text()
        console.log("Raw response:", text)
        data = JSON.parse(text)
      } catch (jsonError) {
        console.error("Failed to parse response as JSON:", jsonError)
        throw new Error("Invalid response from server. Please try again.")
      }

      console.log("Grading result:", data)
      setScores({
        taskAchievement: data.task_response.score,
        coherenceCohesion: data.coherence_and_cohesion.score,
        lexicalResource: data.lexical_resource.score,
        grammaticalRange: data.grammatical_range_and_accuracy.score,
      })
      setFeedbackData(data)
      setIsGraded(true)
    } catch (error) {
      console.error("Error grading essay:", error)
      setError(error instanceof Error ? error.message : "Failed to grade your essay. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setText("")
    setQuestion("")
    setIsGraded(false)
    setFeedbackData(null)
    setError(null)
    setScores({
      taskAchievement: 6,
      coherenceCohesion: 6,
      lexicalResource: 6,
      grammaticalRange: 6,
    })
  }

  const getOverallBand = () => {
    const average =
      (scores.taskAchievement + scores.coherenceCohesion + scores.lexicalResource + scores.grammaticalRange) / 4
    return average.toFixed(1)
  }

  // Get feedback for a specific criterion and feedback type
  const getFeedback = (criterion: string, type: "strengths" | "evaluation" | "areas_for_improvement"): string[] => {
    if (!feedbackData) {
      // Return mock data if no feedback data is available
      const mockFeedback = {
        strengths: [
          "You have addressed the main aspects of the task.",
          "Your essay has a clear structure with introduction, body paragraphs, and conclusion.",
        ],
        evaluation: [
          "Your response demonstrates a good understanding of the topic.",
          "You have used some cohesive devices effectively.",
        ],
        areas_for_improvement: [
          "Try to develop your ideas with more specific examples.",
          "Work on using a wider range of vocabulary.",
        ],
      }
      return mockFeedback[type]
    }

    const map: Record<string, any> = {
      taskAchievement: feedbackData.task_response,
      coherenceCohesion: feedbackData.coherence_and_cohesion,
      lexicalResource: feedbackData.lexical_resource,
      grammaticalRange: feedbackData.grammatical_range_and_accuracy,
    }

    const item = map[criterion]
    if (!item) return ["No feedback available"]

    if (type === "evaluation") {
      return item.evaluation_feedback || ["No evaluation feedback available"]
    } else if (type === "strengths") {
      return item.constructive_feedback?.strengths || ["No strengths feedback available"]
    } else if (type === "areas_for_improvement") {
      const improvements = [
        ...(item.constructive_feedback?.areas_for_improvement || []),
        ...(item.constructive_feedback?.recommendations || []),
      ]
      return improvements.length > 0 ? improvements : ["No improvement feedback available"]
    }

    return ["Feedback not available"]
  }

  const getWordRecommendations = () => {
    return [
      "controversial",
      "debate",
      "perspective",
      "advocate",
      "oppose",
      "beneficial",
      "detrimental",
      "crucial",
      "essential",
      "significant",
      "furthermore",
      "moreover",
      "nevertheless",
      "consequently",
      "therefore",
      "arguably",
      "undoubtedly",
      "inevitably",
      "ultimately",
      "fundamentally",
    ]
  }

  const getCriteriaLabel = (criteria: string) => {
    switch (criteria) {
      case "taskAchievement":
        return "Task Achievement"
      case "coherenceCohesion":
        return "Coherence & Cohesion"
      case "lexicalResource":
        return "Lexical Resource"
      case "grammaticalRange":
        return "Grammatical Range"
      default:
        return criteria
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Writing Task 2</CardTitle>
          <CardDescription>
            Essay writing task where you respond to a point of view, argument, or problem.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label htmlFor="question" className="block text-sm font-medium mb-2">
                Task 2 Question/Prompt
              </label>
              <Textarea
                id="question"
                placeholder="Enter the IELTS Task 2 question or prompt here..."
                className="min-h-[100px]"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="essay" className="block text-sm font-medium mb-2">
                Your Essay Response
              </label>
              <Textarea
                id="essay"
                placeholder="Write your IELTS Writing Task 2 response here..."
                className="min-h-[200px]"
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <div className="flex justify-between w-full">
            <Button variant="outline" onClick={handleReset} disabled={loading}>
              Reset
            </Button>
            <Button onClick={handleGrade} disabled={!text.trim() || !question.trim() || loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Grading...
                </>
              ) : (
                "Grade My Work"
              )}
            </Button>
          </div>

          {error && (
            <Alert variant="destructive" className="w-full">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardFooter>
      </Card>

      {loading && <p className="text-center my-4 text-muted-foreground">Grading in progress...</p>}

      {isGraded && (
        <div className="mt-8 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Task 2 Question</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-3 bg-muted rounded-md">
                <p>{question}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Your IELTS Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <div className="flex justify-center">
                  <div className="bg-green-600 text-white rounded-lg p-8 text-center w-40 h-40 flex flex-col items-center justify-center">
                    <div className="text-sm uppercase font-semibold mb-1">Overall Band</div>
                    <div className="text-5xl font-bold">{getOverallBand()}</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {Object.entries(scores).map(([criteria, score]) => (
                  <div key={criteria} className="bg-muted rounded-lg p-4 text-center">
                    <div className="text-xs uppercase font-semibold mb-1 truncate">{getCriteriaLabel(criteria)}</div>
                    <div className="text-3xl font-bold">{score.toFixed(1)}</div>
                  </div>
                ))}
              </div>

              <div className="space-y-8">
                {Object.entries(scores).map(([criteria, score]) => (
                  <div key={criteria} className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold">{getCriteriaLabel(criteria)}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm font-medium">Score: {score}</span>
                        <div className="h-2 w-full bg-muted rounded-full overflow-hidden flex-1">
                          <div className="h-full bg-primary" style={{ width: `${((score - 5) / 4) * 100}%` }}></div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Strengths Box */}
                      <div className="border rounded-lg overflow-hidden">
                        <div className="bg-green-100 dark:bg-green-900 p-3 flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                          <h4 className="font-medium">Strengths</h4>
                        </div>
                        <div className="p-3 bg-green-50 dark:bg-green-950/50 h-full">
                          <ul className="list-disc list-inside space-y-1 text-sm">
                            {getFeedback(criteria, "strengths").map((item, i) => (
                              <li key={i}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Evaluation Box */}
                      <div className="border rounded-lg overflow-hidden">
                        <div className="bg-blue-100 dark:bg-blue-900 p-3 flex items-center gap-2">
                          <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          <h4 className="font-medium">Evaluation</h4>
                        </div>
                        <div className="p-3 bg-blue-50 dark:bg-blue-950/50 h-full">
                          <ul className="list-disc list-inside space-y-1 text-sm">
                            {getFeedback(criteria, "evaluation").map((item, i) => (
                              <li key={i}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Constructive Feedback Box */}
                      <div className="border rounded-lg overflow-hidden">
                        <div className="bg-amber-100 dark:bg-amber-900 p-3 flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                          <h4 className="font-medium">Areas for Improvement</h4>
                        </div>
                        <div className="p-3 bg-amber-50 dark:bg-amber-950/50 h-full">
                          <ul className="list-disc list-inside space-y-1 text-sm">
                            {getFeedback(criteria, "areas_for_improvement").map((item, i) => (
                              <li key={i}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>

                    {criteria !== "grammaticalRange" && <Separator className="my-6" />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {typeof window !== "undefined" && (
            <HtmlContentDisplay apiEndpoint="/api/detailed-analysis" title="Detailed Essay Analysis" className="mt-6" />
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-amber-500" />
                Improvement Suggestions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-3 bg-muted rounded-md">
                  <p className="font-medium mb-1">Introduction:</p>
                  <p>
                    It is often argued that [topic]. While there are those who believe [perspective A], others maintain
                    that [perspective B]. This essay will examine both viewpoints before reaching a conclusion.
                  </p>
                </div>
                <div className="p-3 bg-muted rounded-md">
                  <p className="font-medium mb-1">Supporting arguments:</p>
                  <p>One compelling argument in favor of [topic] is that it [benefit]. For instance, [example].</p>
                </div>
                <div className="p-3 bg-muted rounded-md">
                  <p className="font-medium mb-1">Conclusion:</p>
                  <p>
                    In conclusion, while [summary of arguments], I believe that [your position] because [main reason].
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-purple-500" />
                Recommended Vocabulary
              </CardTitle>
              <CardDescription>Use these words to enhance your Writing Task 2 performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {getWordRecommendations().map((word, index) => (
                  <Badge key={index} variant="secondary" className="px-3 py-1 text-sm">
                    {word}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
