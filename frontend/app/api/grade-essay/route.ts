import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // Parse the request body
    const body = await request.json();
    const { question, essay } = body;
    
    // Validate input
    if (!question || !essay) {
      return NextResponse.json(
        { error: 'Question and essay are required' },
        { status: 400 }
      );
    }
    
    // Here you would call your actual grading service
    // This could be:
    // 1. Your own NLP model
    // 2. A third-party API like OpenAI
    // 3. A custom service you've built
    
    // Example with a hypothetical grading service:
    const gradingServiceResponse = await fetch('https://your-grading-service.com/api', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GRADING_API_KEY}`
      },
      body: JSON.stringify({ question, essay }),
    });
    
    const gradingResult = await gradingServiceResponse.json();
    
    // Process and format the response as needed
    const formattedResponse = {
      scores: {
        taskAchievement: gradingResult.taskScore,
        coherenceCohesion: gradingResult.coherenceScore,
        lexicalResource: gradingResult.vocabularyScore,
        grammaticalRange: gradingResult.grammarScore,
      },
      wordAnalysis: gradingResult.wordFrequency.map((item: any) => ({
        word: item.word,
        count: item.frequency
      })).slice(0, 5),
      grammarAnalysis: {
        total: gradingResult.totalGrammarErrors,
        types: gradingResult.errorTypes.map((error: any) => ({
          type: error.category,
          count: error.instances
        }))
      }
    };
    
    // Return the formatted response
    return NextResponse.json(formattedResponse);
    
  } catch (error) {
    console.error('Error in grade-essay API route:', error);
    return NextResponse.json(
      { error: 'Failed to grade essay' },
      { status: 500 }
    );
  }
}