import { NextResponse } from 'next/server';
function formatGradingResponse(gradingResult: any) {
  const formatCriterion = (criterionName: string) => ({
    score: gradingResult.evaluation_feedback.criteria[criterionName].score,
    evaluation_feedback: gradingResult.evaluation_feedback.criteria[criterionName].details,
    constructive_feedback: {
      strengths: gradingResult.constructive_feedback.criteria[criterionName].strengths,
      areas_for_improvement: gradingResult.constructive_feedback.criteria[criterionName].areas_for_improvement,
      recommendations: gradingResult.constructive_feedback.criteria[criterionName].recommendations,
    },
  });

  return {
    overall: gradingResult.overall_score,
    task_response: formatCriterion('task_response'),
    coherence_and_cohesion: formatCriterion('coherence_and_cohesion'),
    lexical_resource: formatCriterion('lexical_resource'),
    grammatical_range_and_accuracy: formatCriterion('grammatical_range_and_accuracy'),
  };
}
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { question, answer } = body;

    if (!question || !answer) {
      return NextResponse.json(
        { error: 'Question and answer are required' },
        { status: 400 }
      );
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/process_essay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question: question, answer: answer }), // ✅ match backend model
    });
    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to grade essay' },
        { status: response.status }
      );
    }
    const data = await response.json();  
    const sessionId = data.session_id; // ✅ Get the session ID from the response
    console.log('Session ID:', sessionId); 
    const gradingResult = data.feedback; 
    const formattedResponse = formatGradingResponse(gradingResult);   
    console.log('Formatted response:', formattedResponse);
    const statistics = data.statistics; // ✅ Get the statistics from the response
    console.log('Statistics:', statistics); // ✅ Log the statistics
    const annotatedEssay = data.annotated_essay; // ✅ Get the annotated essay from the response
    console.log('Annotated essay:', annotatedEssay); // ✅ Log the annotated essay
    // return 4 objects: overall, task_response, coherence_and_cohesion, lexical_resource, grammatical_range_and_accuracy
    // return the formatted response, statistics, and annotated essay
    return NextResponse.json({
      sessionId,
      formattedResponse,
      statistics,
      annotatedEssay,
    });
  } catch (error) {
    console.error('Error in grade-essay API route:', error);
    return NextResponse.json(
      { error: 'Failed to grade essay' },
      { status: 500 }
    );
  }
}
// write a function to get the feedback from the grading service
