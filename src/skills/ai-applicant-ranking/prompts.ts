export function buildRankingPrompt(params: {
  jobTitle: string;
  jobDescription: string | null;
  jobQualifications: string | null;
  resumeText: string;
}): string {
  return `You are an expert HR evaluator. Given a job opening and an applicant's resume, evaluate the match.

Job Title: ${params.jobTitle}
Job Description: ${params.jobDescription ?? "Not provided"}
Required Qualifications: ${params.jobQualifications ?? "Not provided"}

Resume:
${params.resumeText}

Respond ONLY with valid JSON in this exact shape:
{
  "score": number from 0 to 100,
  "highlights": ["string", "string"],
  "rationale": "string"
}

Rules:
- score: 90-100 = excellent match, 75-89 = strong, 60-74 = good, below 60 = review needed
- highlights: array of specific observations (strengths or weaknesses), max 5 items
- rationale: one concise sentence summarizing the fit`;
}
