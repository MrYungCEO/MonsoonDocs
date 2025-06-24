export interface DocumentMode {
  id: string;
  name: string;
  description: string;
  icon: string;
  systemPrompt: string;
  placeholderPrompt: string;
}

export const DOCUMENT_MODES: DocumentMode[] = [
  {
    id: 'ebook',
    name: 'Ebook',
    description: 'Professional educational content with chapters',
    icon: 'BookOpen',
    systemPrompt: `Create a professional ebook in markdown format about: {topic}. 

Include the following structure:
- A compelling title and subtitle
- Author information
- Table of contents with clickable links
- Executive summary or introduction
- At least 5-7 detailed chapters with:
  - Chapter titles and subtitles
  - Comprehensive content with examples
  - Bullet points and numbered lists where appropriate
  - Key takeaways or summaries
- Conclusion with actionable insights
- About the author section
- References or further reading (if applicable)

Format the markdown with proper headings (# ## ###), emphasis (*bold*, _italic_), lists, quotes, and other markdown syntax for professional presentation. Make the content engaging, informative, and well-structured for easy reading.

The content should be substantial enough for a professional ebook (aim for comprehensive coverage of the topic).`,
    placeholderPrompt: 'A comprehensive guide to digital marketing with 7 chapters covering SEO, social media, email marketing, and analytics'
  },
  {
    id: 'contract',
    name: 'Contract Template',
    description: 'Legal document templates with proper clauses',
    icon: 'FileText',
    systemPrompt: `Create a professional contract template in markdown format for: {topic}.

Include the following structure:
- Contract title and type
- Parties section (clearly defined)
- Recitals/Background section
- Terms and Conditions with numbered clauses:
  - Scope of work/services
  - Payment terms and schedule
  - Timeline and deliverables
  - Responsibilities of each party
  - Intellectual property rights
  - Confidentiality clauses
  - Termination conditions
  - Dispute resolution
  - Governing law
- Signature blocks
- Appendices/Exhibits (if needed)

Use clear, professional legal language while remaining accessible. Include placeholder text in [BRACKETS] for customizable fields. Format with proper headings, numbered sections, and bullet points for clarity.

Note: This template is for informational purposes and should be reviewed by legal counsel before use.`,
    placeholderPrompt: 'Freelance web development services contract with payment terms, deliverables, and intellectual property clauses'
  },
  {
    id: 'workbook',
    name: 'Workbook',
    description: 'Interactive exercises and learning activities',
    icon: 'PenTool',
    systemPrompt: `Create an interactive workbook in markdown format about: {topic}.

Include the following structure:
- Workbook title and learning objectives
- How to use this workbook section
- Multiple modules/sections with:
  - Learning objectives for each section
  - Brief instructional content
  - Hands-on exercises and activities
  - Reflection questions
  - Practice scenarios
  - Self-assessment checklists
  - Action planning templates
  - Progress tracking sections
- Answer keys or example responses
- Additional resources and next steps
- Progress tracking sheet

Format with clear headings, interactive elements like checkboxes (- [ ]), fill-in-the-blank sections with underscores, and plenty of white space for writing. Include practical exercises that readers can complete immediately.

Make it highly interactive and practical, focusing on application rather than just theory.`,
    placeholderPrompt: 'Personal productivity workbook with time management exercises, goal-setting templates, and habit tracking sheets'
  },
  {
    id: 'journal',
    name: 'Interactive Journal',
    description: 'Guided reflection and personal development',
    icon: 'Heart',
    systemPrompt: `Create an interactive journal in markdown format focused on: {topic}.

Include the following structure:
- Journal introduction and purpose
- How to use this journal effectively
- Daily/weekly reflection prompts organized by themes:
  - Morning intention setting
  - Evening reflection questions
  - Weekly review sections
  - Monthly goal assessment
- Guided exercises for:
  - Self-discovery questions
  - Gratitude practices
  - Goal visualization
  - Challenge reframing
  - Progress celebration
- Inspirational quotes and affirmations
- Tracking templates (mood, habits, goals)
- Milestone celebration pages
- Future self letters

Format with plenty of space for writing (use line breaks), inspiring headers, and a warm, encouraging tone. Include prompts that encourage deep reflection and personal growth.

Make it feel personal, supportive, and transformative - like having a wise friend guide the journey.`,
    placeholderPrompt: 'Mindfulness and gratitude journal with daily reflection prompts, mood tracking, and personal growth exercises'
  },
  {
    id: 'proposal',
    name: 'Business Proposal',
    description: 'Professional project and business proposals',
    icon: 'Briefcase',
    systemPrompt: `Create a professional business proposal in markdown format for: {topic}.

Include the following structure:
- Executive Summary
- Company/Individual Background
- Problem Statement and Needs Analysis
- Proposed Solution with:
  - Detailed approach and methodology
  - Project timeline and milestones
  - Deliverables and outcomes
  - Team and resources
- Investment and Pricing:
  - Detailed cost breakdown
  - Payment schedule
  - Return on investment
- Implementation Plan
- Risk Assessment and Mitigation
- Success Metrics and KPIs
- Terms and Conditions
- Next Steps and Call to Action
- Appendices (testimonials, case studies, etc.)

Use persuasive, professional language that demonstrates value and builds confidence. Include specific details, metrics, and benefits. Format with clear sections, bullet points, and tables where appropriate.

Make it compelling, comprehensive, and action-oriented to win the business.`,
    placeholderPrompt: 'Digital transformation consulting proposal for a mid-size company including strategy, implementation, and training phases'
  }
];