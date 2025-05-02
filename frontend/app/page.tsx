import type { Metadata } from "next"
import IeltsTask2Grader from "@/components/ielts-task2-grader"
// import { IeltsTask2Grader } from "@/components/ielts-task2-grader"
export const metadata: Metadata = {
  title: "IELTS Task 2 Grading Tool",
  description: "Grade your IELTS Writing Task 2 essays and get detailed feedback",
}

export default function Home() {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-center mb-8">IELTS Writing Task 2 Grader</h1>
      <p className="text-center text-muted-foreground mb-8 max-w-2xl mx-auto">
        Submit your IELTS Writing Task 2 essay to receive a detailed assessment, personalized feedback, and vocabulary
        recommendations to improve your score.
      </p>
      <IeltsTask2Grader />
    </div>
  )
}
