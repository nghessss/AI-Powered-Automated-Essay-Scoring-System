import { NextResponse } from 'next/server';

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

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/get_feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question: question, answer: answer }), // ✅ match backend model
    });
    
    const gradingResult = await response.json();
    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to grade essay' },
        { status: response.status }
      );
    }

    const formattedResponse = {
      overall: gradingResult.overall_score,
      task_response: {
        score: gradingResult.evaluation_feedback.criteria.task_response.score,
        evaluation_feedback: gradingResult.evaluation_feedback.criteria.task_response.details,
        constructive_feedback: {
          strengths: gradingResult.constructive_feedback.criteria.task_response.strengths,
          areas_for_improvement: gradingResult.constructive_feedback.criteria.task_response.areas_for_improvement,
          recommendations: gradingResult.constructive_feedback.criteria.task_response.recommendations,
        },
      },
      coherence_and_cohesion: {
        score: gradingResult.evaluation_feedback.criteria.coherence_and_cohesion.score,
        evaluation_feedback: gradingResult.evaluation_feedback.criteria.coherence_and_cohesion.details,
        constructive_feedback: {
          strengths: gradingResult.constructive_feedback.criteria.coherence_and_cohesion.strengths,
          areas_for_improvement: gradingResult.constructive_feedback.criteria.coherence_and_cohesion.areas_for_improvement,
          recommendations: gradingResult.constructive_feedback.criteria.coherence_and_cohesion.recommendations,
        },
      },
      lexical_resource: {
        score: gradingResult.evaluation_feedback.criteria.lexical_resource.score,
        evaluation_feedback: gradingResult.evaluation_feedback.criteria.lexical_resource.details,
        constructive_feedback: {
          strengths: gradingResult.constructive_feedback.criteria.lexical_resource.strengths,
          areas_for_improvement: gradingResult.constructive_feedback.criteria.lexical_resource.areas_for_improvement,
          recommendations: gradingResult.constructive_feedback.criteria.lexical_resource.recommendations,
        },
      },
      grammatical_range_and_accuracy: {
        score: gradingResult.evaluation_feedback.criteria.grammatical_range_and_accuracy.score,
        evaluation_feedback: gradingResult.evaluation_feedback.criteria.grammatical_range_and_accuracy.details,
        constructive_feedback: {
          strengths: gradingResult.constructive_feedback.criteria.grammatical_range_and_accuracy.strengths,
          areas_for_improvement: gradingResult.constructive_feedback.criteria.grammatical_range_and_accuracy.areas_for_improvement,
          recommendations: gradingResult.constructive_feedback.criteria.grammatical_range_and_accuracy.recommendations,
        },
      },
    };

    return NextResponse.json(formattedResponse);

  } catch (error) {
    console.error('Error in grade-essay API route:', error);
    return NextResponse.json(
      { error: 'Failed to grade essay' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const gradingServiceResponse = await fetch('http://34.128.88.209:8000/', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await gradingServiceResponse.json();  // ✅ Parse the JSON body
    console.log('Data from grading service:', data);

    return NextResponse.json(data);  // ✅ Return the parsed data
  } catch (error) {
    console.error('Error in grade-essay API route:', error);
    return NextResponse.json(
      { error: 'Failed to grade essay' },
      { status: 500 }
    );
  }
}
