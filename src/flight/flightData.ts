/* flightData.ts — the narrative payload for the Flight Experience.
   Chapters (rendered as JSX overlays), the suit-disassembly callouts, the
   scroll "hold windows" that drive the choreography, and the altimeter labels.
   Editing the story = editing this file; the engine and components are generic. */

export type ChapterAlign = 'center' | 'left' | 'right';

export interface ChapterBullet {
  /** HTML string — supports <b> for emphasis, matching the original copy. */
  html: string;
}

export interface Chapter {
  id: string;
  align: ChapterAlign;
  screenLabel: string;
  /** Hero chapter renders a distinct layout; flagged here. */
  hero?: boolean;
  /** Compact schematic chapter docks its heading top-left. */
  schematic?: boolean;
  /** Final uplink chapter (CTA buttons). */
  uplink?: boolean;
  eyebrow?: string;
  title?: string;
  where?: string; // HTML — uses <b>
  lead?: string;
  bullets?: ChapterBullet[];
  // hero-only fields
  heroName?: [string, string];
  role?: string;
  tagline?: string;
  sub?: string;
  // schematic-only
  note?: string;
}

export const CHAPTERS: Chapter[] = [
  {
    id: 'ch0',
    align: 'center',
    screenLabel: 'Hero',
    hero: true,
    heroName: ['BHARGAV', 'MANTHA'],
    role: 'Associate Technical Lead',
    tagline: 'I Build Systems That Scale',
    sub: 'Nine years — from one-man freelancer to leading a five-engineer team.',
  },
  {
    id: 'ch1',
    align: 'left',
    screenLabel: 'My Story',
    eyebrow: 'Flight Plan · My Story',
    title: 'Self-taught. Systems-obsessed.',
    lead: 'I taught myself to code and started in 2017 as a one-man freelance shop building chat and voice bots. Every chapter since has widened the scope: a product four companies adopted → operating 40 microservices → architecting a migration sustaining 800+ TPS.',
    bullets: [
      { html: '<b>The thread:</b> take full ownership of an outcome, make the system measurably better, then teach others how.' },
      { html: '<b>Next chapter:</b> leading larger teams on systems where scale is the hard problem.' },
    ],
  },
  {
    id: 'ch2',
    align: 'right',
    screenLabel: 'Chapter 1 — Freelance',
    eyebrow: 'Chapter 1 · Starting From Nothing',
    title: 'Freelance',
    where: '<b>Software Developer</b> · Jan – Dec 2017 · Mumbai',
    lead: 'Fresh out of university with no network and no team — just clients who needed things built. Everything I know about ownership started here.',
    bullets: [
      { html: 'Websites, chatbots and speech-driven animated models — HTML Canvas, Google speech recognition, Python.' },
      { html: 'Cut client costs with AWS Polly text-to-speech; built a Twilio phone bot plus Messenger / WhatsApp bots.' },
    ],
  },
  {
    id: 'ch3',
    align: 'left',
    screenLabel: 'Chapter 2 — Pirates Alert',
    eyebrow: 'Chapter 2 · From Gigs To A Product',
    title: 'Pirates Alert',
    where: '<b>Software Engineer</b> · Jan 2018 – Aug 2020 · Mumbai (Remote)',
    lead: 'Freelance gigs proved I could ship; this role proved I could build something companies depend on every day.',
    bullets: [
      { html: 'Built a pirated-content detection app adopted by <b>4 companies</b> — my first system running unattended in production.' },
      { html: 'Full stack and beyond: Node.js, Angular, React, Python, FFMPEG, GCP, Google Vision / Tesseract.' },
    ],
  },
  {
    id: 'ch4',
    align: 'right',
    screenLabel: 'Chapter 3 — Irislogic',
    eyebrow: 'Chapter 3 · Learning Scale & Reliability',
    title: 'Irislogic',
    where: '<b>Programmer Analyst</b> · Aug 2020 – Mar 2022 · Santa Clara, CA (Remote)',
    lead: 'My first taste of real scale — and the first time my job was making other engineers faster, not just shipping my own code.',
    bullets: [
      { html: 'Shipped and operated <b>40+ microservices at 100 QPS</b> — the distributed-systems apprenticeship.' },
      { html: 'CSV validation <b>10 min → 2 min</b>; support tickets <b>−70%</b> by owning error handling end-to-end.' },
      { html: 'Universal AWS services (SQS·SNS·SES) consumed by 6 other teams — my first force-multiplier code.' },
    ],
  },
  {
    id: 'ch5',
    align: 'left',
    screenLabel: 'Chapter 4 — Delivery Solutions',
    eyebrow: 'Chapter 4 · Multiplying Through A Team',
    title: 'Delivery Solutions',
    where: '<b>Associate Technical Lead</b> · Mar 2022 – Present · Remote',
    lead: 'The chapter where it all converged: the scale lessons became the company’s biggest shift — and I lead the five engineers delivering it.',
    bullets: [
      { html: 'Lead a <b>5-engineer team</b> across 4 epic initiatives — 100+ issues, 20 projects.' },
      { html: 'Monolith → <b>40+ DDD microservices</b> sustaining <b>800+ TPS</b>: 73% faster, 34% cheaper.' },
      { html: 'Fortune-500 workflow automation (McKesson, UPS) · <b>14 zero-downtime deployments</b> · 85% coverage.' },
    ],
  },
  {
    id: 'ch6',
    align: 'left',
    screenLabel: 'Suit Schematic',
    schematic: true,
    eyebrow: 'Suit Schematic',
    title: 'Capability Map',
    note: 'EVERY PART EARNED IN A DIFFERENT CHAPTER',
  },
  {
    id: 'ch7',
    align: 'center',
    screenLabel: 'Establish Uplink',
    uplink: true,
    eyebrow: 'Establish Uplink',
    title: 'The next chapter: systems where scale is the hard problem',
    lead: 'Ready to lead larger teams on them. Open a channel.',
  },
];

/** Hold windows in scroll progress p; flight happens in the gaps between them. */
export const RANGES: [number, number][] = [
  [0.0, 0.085], // 0 hero
  [0.12, 0.205], // 1 my story
  [0.24, 0.325], // 2 chapter 1 freelance
  [0.36, 0.445], // 3 chapter 2 pirates alert
  [0.48, 0.565], // 4 chapter 3 irislogic
  [0.6, 0.685], // 5 chapter 4 delivery solutions
  [0.72, 0.88], // 6 suit schematic (long hold for disassembly)
  [0.915, 1.0], // 7 uplink
];

export const ALT_LABELS = [
  'Hero',
  'My Story',
  'Ch.1 Freelance',
  'Ch.2 Pirates Alert',
  'Ch.3 Irislogic',
  'Ch.4 Delivery Solutions',
  'Suit Schematic',
  'Uplink',
];

export interface Callout {
  part: keyof import('./buildSuit').SuitParts;
  label: string;
  skill: string;
  techs: string;
  dx: number;
  dy: number;
}

export const CALLOUTS: Callout[] = [
  { part: 'helmet', label: 'Helmet', skill: 'Leadership', techs: 'Team of 5 — mentoring, epic planning, stakeholder alignment, code-review culture', dx: 150, dy: -50 },
  { part: 'reactor', label: 'Arc Reactor', skill: 'Core Stack', techs: 'Node.js · TypeScript · NestJS · Angular · React · TypeORM · MongoDB · MySQL', dx: 175, dy: -15 },
  { part: 'armR', label: 'Right Gauntlet', skill: 'Infrastructure', techs: 'AWS (SQS·SNS·SES·ECS) · Docker · Kubernetes · Jenkins · Redis · gRPC', dx: 115, dy: 100 },
  { part: 'armL', label: 'Left Gauntlet', skill: 'Practices', techs: 'Domain-Driven Design · SOLID · TDD · multi-tenant architecture · OAuth / JWT', dx: -115, dy: 100 },
  { part: 'torso', label: 'Chest Plate', skill: 'Beyond the Day Job', techs: 'NestJS contributor · 7,000+ blog views · Athena programming language', dx: -185, dy: -20 },
  { part: 'legL', label: 'Left Boot', skill: 'Education', techs: 'B.Sc. IT — University of Mumbai (2017) · self-taught engineer', dx: -100, dy: 28 },
  { part: 'legR', label: 'Right Boot', skill: 'Certifications', techs: 'NestJS Zero to Hero · AWS ECS & Fargate · ML/DL — IIT Delhi', dx: 100, dy: 28 },
];

export const CONTACT = {
  email: 'manthabhargav@gmail.com',
  linkedin: 'https://www.linkedin.com/in/bhargav-mantha/',
  resume: '/Bhargav_Mantha.pdf',
  // Prefilled into the "Send Transmission" mailto so it opens ready to send.
  subject: 'Flight uplink — let’s talk',
  body: [
    'Hi Bhargav,',
    '',
    'I came across your portfolio and would like to connect about an opportunity.',
    '',
    'A bit about the role / team:',
    '',
    '',
    '— ',
  ].join('\n'),
};

/** Build the mailto: URL with subject + body prefilled. */
export function buildMailto(): string {
  const q = `subject=${encodeURIComponent(CONTACT.subject)}&body=${encodeURIComponent(CONTACT.body)}`;
  return `mailto:${CONTACT.email}?${q}`;
}
