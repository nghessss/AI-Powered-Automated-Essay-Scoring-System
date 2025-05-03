"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface HtmlContentDisplayProps {
  apiEndpoint?: string
  htmlContent?: string
  title?: string
  className?: string
}

export default function HtmlContentDisplay({
  htmlContent: initialHtmlContent,
  title = "Detailed Analysis",
  className = "",
}: HtmlContentDisplayProps) {
  const [htmlContent, setHtmlContent] = useState<string>(initialHtmlContent || "")
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // If direct HTML content is provided, use it
    if (initialHtmlContent) {
      setHtmlContent(initialHtmlContent)
      return
    }

    // Otherwise fetch from API endpoint

  }, [initialHtmlContent])

  // Function to handle showing suggestion when an error is clicked
  const handleShowSuggestion = (element: HTMLElement) => {
    // Get the suggestion from the data attribute
    const suggestion = element.getAttribute("data-suggestion")

    if (suggestion) {
      // Create elements for the correction display
      const originalText = element.textContent || ""

      // Create a span for the strikethrough original text
      const strikethroughSpan = document.createElement("span")
      strikethroughSpan.className = "strikethrough"
      strikethroughSpan.textContent = originalText

      // Create a span for the suggested correction
      const correctionSpan = document.createElement("span")
      correctionSpan.className = "correction"
      correctionSpan.textContent = suggestion

      // Clear the original element and append the new spans
      element.textContent = ""
      element.appendChild(strikethroughSpan)
      element.appendChild(correctionSpan)

      // Change styling to show it's been corrected
      element.classList.remove("error-block")
      element.classList.add("corrected")

      // Remove the onclick handler
      element.removeAttribute("onclick")
    }
  }

  useEffect(() => {
    // Add the showSuggestion function to the window object so it can be called from inline onclick handlers
    ;(window as any).showSuggestion = (element: HTMLElement) => {
      handleShowSuggestion(element)
    }

    // Clean up function
    return () => {
      delete (window as any).showSuggestion
    }
  }, [])

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Failed to load content: {error}</AlertDescription>
          </Alert>
        )}

        {!isLoading && !error && htmlContent && (
          <>
            <style jsx global>{`
              .error-block {
                text-decoration: underline wavy red;
                cursor: pointer;
                position: relative;
              }
              .error-block:hover {
                background-color: rgba(255, 0, 0, 0.1);
              }
              .corrected {
                text-decoration: none;
                cursor: default;
              }
              .strikethrough {
                color: #888;
                text-decoration: line-through;
                margin-right: 0.25rem;
              }
              .correction {
                color: green;
                font-weight: 500;
              }
              .paragraph {
                margin-bottom: 1rem;
                line-height: 1.6;
              }
            `}</style>
            <div
              className="prose prose-sm max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
          </>
        )}

        {!isLoading && !error && !htmlContent && (
          <div className="text-center py-8 text-muted-foreground">No content available</div>
        )}
      </CardContent>
    </Card>
  )
}
