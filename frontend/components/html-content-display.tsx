"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface HtmlContentDisplayProps {
  apiEndpoint: string
  title?: string
  className?: string
}

export default function HtmlContentDisplay({
  apiEndpoint,
  title = "Detailed Analysis",
  className = "",
}: HtmlContentDisplayProps) {
  const [htmlContent, setHtmlContent] = useState<string>("")
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchHtmlContent = async () => {
      if (!apiEndpoint) return

      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(apiEndpoint)

        if (!response.ok) {
          throw new Error(`Failed to fetch content: ${response.status}`)
        }

        const data = await response.json()

        // Check if the API returns an object with an html property
        if (data.html) {
          setHtmlContent(data.html)
        } else if (typeof data === "string") {
          // If the API returns HTML directly as a string
          setHtmlContent(data)
        } else {
          // If the API returns a different structure, convert it to string
          setHtmlContent(JSON.stringify(data))
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred")
        console.error("Error fetching HTML content:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchHtmlContent()
  }, [apiEndpoint])

  // Function to handle editing text when an error is clicked
  const handleEditText = (element: HTMLElement) => {
    // Find the next sibling with class 'suggestion'
    const suggestionSpan = element.nextElementSibling

    if (suggestionSpan && suggestionSpan.classList.contains("suggestion")) {
      // Get the original error text
      const errorText = element.textContent || ""

      // Get the suggested correction
      const suggestion = suggestionSpan.textContent || ""

      // Create a new span for the strikethrough error text
      const strikethroughSpan = document.createElement("span")
      strikethroughSpan.className = "strikethrough"
      strikethroughSpan.textContent = errorText

      // Create a new span for the correction
      const correctionSpan = document.createElement("span")
      correctionSpan.className = "correction"
      correctionSpan.textContent = suggestion

      // Clear the original error element and append the new spans
      element.textContent = ""
      element.appendChild(strikethroughSpan)
      element.appendChild(correctionSpan)

      // Change styling to show it's been corrected
      element.classList.remove("error")
      element.classList.add("corrected")

      // Remove the onclick handler
      element.removeAttribute("onclick")

      // Hide the suggestion span
      if (suggestionSpan) {
        (suggestionSpan as HTMLElement).style.display = "none"
      }
    }
  }

  useEffect(() => {
    // Add the editText function to the window object so it can be called from inline onclick handlers
    ;(window as any).editText = (element: HTMLElement) => {
      handleEditText(element)
    }

    // Clean up function
    return () => {
      delete (window as any).editText
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
              .error {
                text-decoration: underline red;
                cursor: pointer;
                position: relative;
              }
              .suggestion {
                display: none;
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
