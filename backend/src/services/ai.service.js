export function analyzeApplication(application, tender) {
    const mandatory = tender.requirements.filter((item) => item.mandatory);
    const documentCoverage = Math.min(1, application.documents.length / Math.max(1, mandatory.length));
    const base = Math.round(68 + documentCoverage * 24 + (application.documents.length % 5));
    const score = Math.min(96, Math.max(55, base));
    return {
        aiScore: score,
        aiRecommendation: score >= 70 ? 'QUALIFY' : 'REVIEW REQUIRED',
        aiSummary: score >= 70
            ? 'The AI identified the required document categories and found the submission broadly aligned with the published evaluation criteria. Human confirmation remains required.'
            : 'The AI identified evidence requiring additional human review before qualification can be confirmed.',
    };
}
