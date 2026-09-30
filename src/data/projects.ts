export interface FlagshipProject {
  domain: string;
  name: string;
  description: string;
  tech: string[];
  image: string;
  accentChip?: string;
}

export interface AiHighlight {
  domain: string;
  name: string;
  points: string[];
  tags: string[];
}

export interface ListProject {
  name: string;
  domain: string;
  meta: string;
  description: string;
}

export const flagshipProjects: FlagshipProject[] = [
  {
    domain: "E-Commerce",
    name: "Plixstar",
    description:
      "Multi-vendor marketplace for eco-friendly products, built for the Malaysian market. Lead engineer, 1,195+ commits — admin and vendor portals, plus two in-product AI assistants.",
    tech: ["React.js", "Next.js", "Supabase", "Railway"],
    image: "/projects/plixstar.jpg",
  },
  {
    domain: "EdTech",
    name: "School4me",
    description:
      "Web-first school communication and management platform for Malaysian schools. Lead engineer, 475+ commits. In active development.",
    tech: ["React.js", "Next.js", "MySQL", "AWS", "Portainer"],
    image: "/projects/school4me.jpg",
  },
  {
    domain: "Healthcare",
    name: "Grateful Healthcare",
    description:
      "Marketing and booking site for a 5-branch scoliosis treatment clinic across Malaysia, paired with an internal staff ERP tool I built and now lead as Head of IT.",
    tech: ["React.js", "Tailwind CSS", "Node.js", "MySQL"],
    image: "/projects/grateful-healthcare.jpg",
  },
  {
    domain: "Logistics",
    name: "Warehouse Management System",
    description:
      "Internal warehouse operations platform built around an AI-assisted data importer that maps messy spreadsheet columns onto system fields, plus a companion Flutter sales app.",
    tech: ["React", "Node.js", "Express.js", "Flutter", "Ubuntu Linux"],
    image: "/projects/warehouse-ms.jpg",
  },
  {
    domain: "AI Tooling",
    name: "Supertools",
    description:
      "Public SaaS app wrapping Google Gemini behind a Next.js front end — scored SEO audits with shareable reports, plus video summarization with transcript extraction and translation.",
    tech: ["Next.js", "Google Gemini API", "Node.js"],
    image: "/projects/supertools.jpg",
  },
];

export const aiHighlights: AiHighlight[] = [
  {
    domain: "Chatbot",
    name: "Plixie — AI Shopping Assistant",
    points: [
      "Two-stage plan → recommendation flow with JSON-schema-constrained output — only ever recommends real catalogue product IDs, never a hallucinated one",
      "Multi-locale (English / Malay / Chinese) with localized fallback copy",
    ],
    tags: ["Structured outputs", "Catalogue-grounded", "Quota & guardrails"],
  },
  {
    domain: "Chatbot / RAG",
    name: "Plixstar Docs Assistant",
    points: [
      "Retrieval-augmented chatbot that searches the docs corpus before answering and cites sources as links",
      "Explicit prompt-injection defense — retrieved text is treated strictly as reference data, never instructions",
    ],
    tags: ["RAG", "Prompt-injection defense", "Streaming"],
  },
  {
    domain: "Chatbot",
    name: '"Oyen" — Sarawak Travel Assistant',
    points: [
      "Gemini-powered chatbot embedded in Bus MY Sarawak, with a scoped persona and a hard topic boundary",
      "Multi-turn conversation history, paired with a separate AI trip-planning endpoint",
    ],
    tags: ["Google Gemini API", "Conversational AI", "Guardrails"],
  },
  {
    domain: "Dev Tooling",
    name: "@ew53/seo-toolkit",
    points: [
      "Published package running a full crawl → suggest → fix → PR → report pipeline",
      "Designed to pair with Claude Code for generating the suggested fixes",
    ],
    tags: ["Published package", "Claude Code", "Automation pipeline"],
  },
];

export const moreProjects: ListProject[] = [
  {
    name: "Primo",
    domain: "Talent Ops",
    meta: "React · Node.js",
    description: "Management platform prototype for a talent and casting agency.",
  },
  {
    name: "TMC LMS",
    domain: "Library Systems",
    meta: "React.js · MySQL",
    description: "Library management system for a congregation-based organization, replacing manual book tracking.",
  },
  {
    name: "Bus MY Sarawak",
    domain: "Transit",
    meta: "React Native · Gemini API",
    description: 'Real-time bus platform for Sarawak, with a built-in Gemini-powered travel chatbot, "Oyen".',
  },
  {
    name: "Salesman Tracker",
    domain: "Field Ops",
    meta: "Flutter",
    description: "Field-sales mobile app used alongside the Warehouse Management System.",
  },
  {
    name: "Quote Easy 報價易",
    domain: "AI Tooling · Team",
    meta: "React · Laravel",
    description: "AI-assisted quoting & invoicing PWA for Hong Kong renovation contractors — Cantonese site walk-throughs become structured, priced quotes.",
  },
  {
    name: "Project RISE",
    domain: "Education · Team",
    meta: "LMS Demo",
    description: "Learning management system demo built for a real Education University of Hong Kong tender.",
  },
];
