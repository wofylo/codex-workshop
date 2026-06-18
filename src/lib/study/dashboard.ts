export type StudyDomain = {
  slug: string;
  order: number;
  title: string;
  shortTitle: string;
  weight: number;
  difficulty: string;
  questionEstimate: string;
  focus: string;
  nextAction: string;
  englishGuide: string;
  chineseGuide: string;
};

const studyDomains = [
  {
    slug: "agentic-architecture",
    order: 1,
    title: "Agentic Architecture & Orchestration",
    shortTitle: "Agentic Architecture",
    weight: 27,
    difficulty: "Hardest",
    questionEstimate: "~16 questions",
    focus: "Multi-agent orchestration, failure gates, human oversight.",
    nextAction: "Start with scenario patterns and failure gates.",
    englishGuide: "CCA-F/01_Domain_Agentic_Architecture.md",
    chineseGuide: "CCA-F/01_Domain_Agentic_Architecture_zh.md",
  },
  {
    slug: "claude-code",
    order: 2,
    title: "Claude Code Configuration",
    shortTitle: "Claude Code",
    weight: 20,
    difficulty: "Moderate-Hard",
    questionEstimate: "~12 questions",
    focus: "Instruction hierarchy, hooks, skills, workspace configuration.",
    nextAction: "Review CLAUDE.md hierarchy and tool permission boundaries.",
    englishGuide: "CCA-F/02_Domain_Claude_Code.md",
    chineseGuide: "CCA-F/02_Domain_Claude_Code_zh.md",
  },
  {
    slug: "tool-design-mcp",
    order: 3,
    title: "Tool Design & MCP Integration",
    shortTitle: "Tool Design / MCP",
    weight: 18,
    difficulty: "Moderate",
    questionEstimate: "~11 questions",
    focus: "Tool contracts, MCP server boundaries, least-privilege access.",
    nextAction: "Compare tool design mistakes against secure MCP patterns.",
    englishGuide: "CCA-F/03_Domain_Tool_Design_MCP.md",
    chineseGuide: "CCA-F/03_Domain_Tool_Design_MCP_zh.md",
  },
  {
    slug: "prompt-engineering",
    order: 4,
    title: "Prompt Engineering",
    shortTitle: "Prompt Engineering",
    weight: 18,
    difficulty: "Moderate",
    questionEstimate: "~11 questions",
    focus: "Prompt structure, eval-driven iteration, scenario constraints.",
    nextAction: "Practice rewriting vague prompts into constrained tasks.",
    englishGuide: "CCA-F/04_Domain_Prompt_Engineering.md",
    chineseGuide: "CCA-F/04_Domain_Prompt_Engineering_zh.md",
  },
  {
    slug: "context-management",
    order: 5,
    title: "Context Management (CALM)",
    shortTitle: "Context Management",
    weight: 17,
    difficulty: "Easiest once memorized",
    questionEstimate: "~10 questions",
    focus: "Context windows, memory tradeoffs, caching and retrieval choices.",
    nextAction: "Memorize CALM-style tradeoffs and caching constraints.",
    englishGuide: "CCA-F/05_Domain_Context_Management.md",
    chineseGuide: "CCA-F/05_Domain_Context_Management_zh.md",
  },
] satisfies StudyDomain[];

export function getStudyDomains(): StudyDomain[] {
  return studyDomains.map((domain) => ({ ...domain }));
}

export function getSuggestedDomain(): StudyDomain {
  return getStudyDomains().sort((a, b) => b.weight - a.weight)[0];
}

export function getDashboardSummary() {
  return {
    domainCount: studyDomains.length,
    totalExamWeight: studyDomains.reduce((total, domain) => total + domain.weight, 0),
    guideCount: studyDomains.length * 2,
  };
}
