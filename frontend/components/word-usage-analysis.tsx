"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface WordUsageAnalysisProps {
    analysis: {
      top_repeated_content_words: Array<{ word: string; count: number }>
      coherence_word_count: number
    }
  }

export default function WordUsageAnalysis({ analysis }: WordUsageAnalysisProps) {
    const topWords = analysis.top_repeated_content_words || []
  
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Word Usage Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="bg-muted rounded-lg p-4 text-center">
              <div className="text-xs uppercase font-semibold mb-1">Coherence Word Count</div>
              <div className="text-3xl font-bold">{analysis.coherence_word_count}</div>
            </div>
  
            <div>
              <h3 className="text-lg font-medium mb-4">Top Repeated Content Words</h3>
  
              {topWords.length > 0 ? (
                <>
                  <div className="mb-6">
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={topWords} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="word" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#8884d8" name="Occurrences" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {topWords.map((item, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-muted/50 rounded-md">
                        <span className="font-medium">{item.word}</span>
                        <span className="bg-primary/10 text-primary px-2 py-1 rounded-full text-sm font-semibold">
                          {item.count} {item.count === 1 ? "time" : "times"}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">No significant word usage data available</div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }