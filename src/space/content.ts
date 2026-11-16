/* content.ts — everything the homepage says. The game and the classic view
   both render from this file, so editing the story means editing only here. */

export interface Hero {
  name: string;
  role: string;
  tagline: string;
  sub: string;
}

export const HERO: Hero = {
  name: 'Bhargav Mantha',
  role: 'Associate Technical Lead',
  tagline: 'I build systems that scale.',
  sub: 'Nine years, from a one-person freelance shop to leading a five-engineer team.',
};

export type StopKind = 'story' | 'job' | 'skills' | 'contact';

export interface Stop {
  id: string;
  kind: StopKind;
  /** Short name used on the route bar and planet label. */
  short: string;
  eyebrow: string;
  title: string;
  /** HTML; may contain <b>. */
  where?: string;
  lead: string;
  /** HTML strings; may contain <b>. */
  bullets?: string[];
}

export const STOPS: Stop[] = [
  {
    id: 'story',
    kind: 'story',
    short: 'My story',
    eyebrow: 'My story',
    title: 'Self-taught. Systems-obsessed.',
    lead:
      'I taught myself to code and started in 2017 as a one-person freelance shop building chat and voice bots. Each role since has widened the scope: a product four companies adopted, then operating 40 microservices, then architecting a migration that sustains 800+ TPS.',
    bullets: [
      '<b>The thread:</b> take full ownership of an outcome, make the system measurably better, then teach others how.',
      '<b>Next:</b> leading larger teams on systems where scale is the hard problem.',
    ],
  },
  {
    id: 'freelance',
    kind: 'job',
    short: 'Freelance',
    eyebrow: 'Chapter 1 · 2017',
    title: 'Freelance',
    where: '<b>Software Developer</b>, Jan – Dec 2017, Mumbai',
    lead: 'Fresh out of university with no network and no team, just clients who needed things built. Everything I know about ownership started here.',
    bullets: [
      'Websites, chatbots and speech-driven animated models with HTML Canvas, Google speech recognition and Python.',
      'Cut client costs with AWS Polly text-to-speech; built a Twilio phone bot plus Messenger and WhatsApp bots.',
    ],
  },
  {
    id: 'pirates',
    kind: 'job',
    short: 'Pirates Alert',
    eyebrow: 'Chapter 2 · 2018–2020',
    title: 'Pirates Alert',
    where: '<b>Software Engineer</b>, Jan 2018 – Aug 2020, Mumbai (remote)',
    lead: 'Freelance work proved I could ship. This role proved I could build something companies depend on every day.',
    bullets: [
      'Built a pirated-content detection app adopted by <b>4 companies</b>, my first system running unattended in production.',
      'Full stack and beyond: Node.js, Angular, React, Python, FFmpeg, GCP, Google Vision and Tesseract.',
    ],
  },
  {
    id: 'irislogic',
    kind: 'job',
    short: 'Irislogic',
    eyebrow: 'Chapter 3 · 2020–2022',
    title: 'Irislogic',
    where: '<b>Programmer Analyst</b>, Aug 2020 – Mar 2022, Santa Clara, CA (remote)',
    lead: 'My first taste of real scale, and the first time my job was making other engineers faster rather than only shipping my own code.',
    bullets: [
      'Shipped and operated <b>40+ microservices at 100 QPS</b>.',
      'CSV validation cut from <b>10 minutes to 2</b>; support tickets down <b>70%</b> by owning error handling end to end.',
      'Shared AWS services (SQS, SNS, SES) used by 6 other teams.',
    ],
  },
  {
    id: 'delivery',
    kind: 'job',
    short: 'Delivery Solutions',
    eyebrow: 'Chapter 4 · 2022–now',
    title: 'Delivery Solutions',
    where: '<b>Associate Technical Lead</b>, Mar 2022 – present, remote',
    lead: 'Where it all came together: the scale lessons became the company’s biggest shift, and I lead the five engineers delivering it.',
    bullets: [
      'Lead a <b>5-engineer team</b> across 4 epic initiatives: 100+ issues, 20 projects.',
      'Monolith to <b>40+ DDD microservices</b> sustaining <b>800+ TPS</b>: 73% faster, 34% cheaper.',
      'Fortune 500 workflow automation (McKesson, UPS), <b>14 zero-downtime deployments</b>, 85% test coverage.',
    ],
  },
  {
    id: 'skills',
    kind: 'skills',
    short: 'Skills',
    eyebrow: 'Capability map',
    title: 'Every skill came from a different chapter',
    lead: 'You pick these up on the way here. Any you flew past are still listed, just not lit.',
  },
  {
    id: 'contact',
    kind: 'contact',
    short: 'Contact',
    eyebrow: 'Open a channel',
    title: 'Next: systems where scale is the hard problem',
    lead: 'I’m ready to lead larger teams on them. Let’s talk.',
  },
];

export interface Skill {
  name: string;
  detail: string;
}

export const SKILLS: Skill[] = [
  { name: 'Leadership', detail: 'Team of 5: mentoring, epic planning, stakeholder alignment, code-review culture' },
  { name: 'Core stack', detail: 'Node.js, TypeScript, NestJS, Angular, React, TypeORM, MongoDB, MySQL' },
  { name: 'Infrastructure', detail: 'AWS (SQS, SNS, SES, ECS), Docker, Kubernetes, Jenkins, Redis, gRPC' },
  { name: 'Practices', detail: 'Domain-Driven Design, SOLID, TDD, multi-tenant architecture, OAuth and JWT' },
  { name: 'Beyond the day job', detail: 'NestJS contributor, 7,000+ blog readers, the Athena programming language' },
  { name: 'Education', detail: 'B.Sc. IT, University of Mumbai (2017); self-taught engineer' },
  { name: 'Certifications', detail: 'NestJS Zero to Hero, AWS ECS and Fargate, ML/DL from IIT Delhi' },
];

export const CONTACT = {
  email: 'manthabhargav@gmail.com',
  linkedin: 'https://www.linkedin.com/in/bhargav-mantha/',
  resume: '/Bhargav_Mantha.pdf',
  subject: 'Saw your portfolio — let’s talk',
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

export function buildMailto(): string {
  const q = `subject=${encodeURIComponent(CONTACT.subject)}&body=${encodeURIComponent(CONTACT.body)}`;
  return `mailto:${CONTACT.email}?${q}`;
}
