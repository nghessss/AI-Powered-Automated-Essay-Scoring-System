"use client"

import { useState } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, BookOpen, Lightbulb } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import {} from "@/app/api/grade-essay/route"
import HtmlContentDisplay from "@/components/html-content-display"

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
  const [feedbackData, setFeedbackData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const handleGrade = async () => {
    try {
      setLoading(true);
      console.log("Question:", question)
      // console log essay
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
        throw new Error(`Failed to grade essay: ${response.status}`)
      }
      // console log question
      
  
      const data = await response.json()
      console.log("Grading result:", data)
      setScores({
        taskAchievement: data.task_response.score,
        coherenceCohesion: data.coherence_and_cohesion.score,
        lexicalResource: data.lexical_resource.score,
        grammaticalRange: data.grammatical_range_and_accuracy.score,
      });
      setFeedbackData(data);
      setIsGraded(true)
      setLoading(false);
    } catch (error) {
      console.error("Error grading essay:", error)
    }
  }

  const handleReset = () => {
    setText("")
    setQuestion("")
    setIsGraded(false)
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

  const getFeedback = (criterion: string): string[] => {
    if (!feedbackData) return ["Feedback not available"];
  
    const map: Record<string, any> = {
      taskAchievement: feedbackData.task_response,
      coherenceCohesion: feedbackData.coherence_and_cohesion,
      lexicalResource: feedbackData.lexical_resource,
      grammaticalRange: feedbackData.grammatical_range_and_accuracy,
    };
  
    const item = map[criterion];
    if (!item) return ["No feedback for this criterion"];
  
    const {
      evaluation_feedback,
      constructive_feedback: { strengths = [], areas_for_improvement = [], recommendations = [] } = {},
    } = item;
  
    return [
      ...evaluation_feedback,
      ...strengths,
      ...areas_for_improvement,
      ...recommendations,
    ];
  };

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
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={handleReset} disabled={loading}>
            Reset
          </Button>
          <Button onClick={handleGrade} disabled={!text.trim() || !question.trim() || loading}>
            {loading ? "Grading..." : "Grade My Work"}
          </Button>
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

              <div className="space-y-6">
                {Object.entries(scores).map(([criteria, score]) => (
                  <div key={criteria} className="space-y-2">
                    <div className="flex justify-between mb-2">
                      <label className="text-sm font-medium">{getCriteriaLabel(criteria)}</label>
                      <span className="text-sm font-bold">{score}</span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${((score - 5) / 4) * 100}%` }}></div>
                    </div>
                    <Alert className="mt-2">
                      <AlertCircle className="h-4 w-4" />
                      <div className="space-y-1">
                        {getFeedback(criteria).map((feedback, index) => (
                          <AlertDescription key={index}>• {feedback}</AlertDescription>
                        ))}
                      </div>
                    </Alert>
                    {criteria !== "grammaticalRange" && <Separator className="my-4" />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <HtmlContentDisplay apiEndpoint="/api/detailed-analysis" title="Detailed Essay Analysis" className="mt-6" />

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
