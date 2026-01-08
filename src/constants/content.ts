export const PROFILE = {
  name: 'Bhargav Mantha',
  title: 'Technical Lead',
  tagline: 'I Build Systems That Scale',
  description: 'Enterprise-grade microservices architecture for companies that move fast',
  email: 'manthabhargav@gmail.com',
  github: 'https://github.com/BhargavMantha',
  linkedin: 'https://www.linkedin.com/in/bhargav-mantha/',
  blog: 'https://dev.to/bhargavmantha',
};

export const METRICS = [
  { value: '800+', label: 'TPS', color: '#FFC107' },        // Vibrant Gold
  { value: '40+', label: 'Microservices', color: '#00D4FF' }, // Electric Blue
  { value: '73%', label: 'Performance ↑', color: '#0096FF' }, // Medium Blue
  { value: '14', label: 'Zero-Downtime', color: '#E0F4FF' },  // Ice Blue
];

export const SKILLS = {
  frontend: ['Angular', 'React', 'PrimeNG', 'RxJS'],
  backend: ['Node.js', 'NestJS', 'TypeScript', 'gRPC'],
  data: ['TypeORM', 'MySQL', 'MongoDB', 'Redis'],
  infrastructure: ['AWS', 'Docker', 'Kubernetes', 'Jenkins'],
};

export const EXPERIENCE = [
  {
    company: 'Delivery Solutions',
    role: 'Associate Technical Lead',
    period: 'Mar 2022 - Present',
    location: 'Mumbai, INDIA (Remote)',
    achievements: [
      'Architected microservices handling 800+ TPS with 73% performance boost and 34% cost reduction',
      'Led 4 epic initiatives delivering 100 issues across 20 projects with measurable business impact',
      'Resolved 23 critical bugs including 5 production issues, 85% test coverage, 14 zero-downtime deployments',
      'Transformed monolithic systems into 40+ microservices achieving 48% performance improvement',
      'Built workflow automation for Fortune 500 (McKesson, UPS) with SFTP, OAuth, webhooks',
      'Engineered multi-tenant security with JWT validation and request-scoped context',
    ],
    tags: ['NestJS', 'AWS', 'TypeORM', 'Docker', 'Kubernetes', 'OAuth', 'JWT'],
  },
  {
    company: 'Irislogic',
    role: 'Programmer Analyst',
    period: 'Aug 2020 - Mar 2022',
    location: 'Santa Clara, CA (Remote)',
    achievements: [
      'Implemented 40+ microservices handling 100 QPS with AWS (SQS, SNS, SES)',
      'Improved CSV validation from 10min to 2min using AJV',
      'Reduced support tickets by 70% through error handling and HTTP code mapping',
      'Built user management with MFA using Passport+JWT for 300 concurrent users',
      'Devised CI/CD pipelines for 0 downtime and 20X faster deployment',
    ],
    tags: ['Node.js', 'NestJS', 'AWS', 'TypeORM', 'Passport', 'JWT', 'Kubernetes'],
  },
  {
    company: 'Pirates Alert',
    role: 'Software Engineer',
    period: 'Jan 2018 - Aug 2020',
    location: 'Mumbai, INDIA (Remote)',
    achievements: [
      'Built pirated content detection app used by 4 companies',
      'Used ML, FFMPEG, GCP, Google Vision/Tesseract for image recognition',
    ],
    tags: ['Node.js', 'Python', 'Angular', 'React', 'ML', 'FFMPEG', 'GCP'],
  },
];

export const PROJECTS = [
  {
    name: 'Life-Optimization System',
    category: 'AI/ML',
    description: 'AI-Powered Life Graph Database with RAG Integration',
    details: 'Bipolar-aware pattern recognition with 3-7 day episode prediction. Multi-model AI on dual-GPU cluster.',
    tags: ['NestJS', 'Neo4j', 'PostgreSQL', 'Chroma DB', 'LangChain', 'Kubernetes'],
    featured: true,
    color: 'purple',
  },
  {
    name: 'Athena HomeLab + GPU K8s Cluster',
    category: 'Infrastructure',
    description: '3-Node GPU Kubernetes Cluster for ₹6,000',
    details: 'Self-hosted infrastructure with Proxmox, K3s, GitOps. Running 24+ pods with dual-GPU setup.',
    tags: ['Kubernetes', 'Proxmox', 'ArgoCD', 'NFS'],
    featured: true,
    color: 'cyan',
  },
  {
    name: 'Athena Programming Language',
    category: 'Languages',
    description: 'Custom compiler with AST and grammar design',
    tags: ['TypeScript', 'Compiler Design', 'SOLID'],
    github: 'https://github.com/BhargavMantha/athena-programming-language',
    color: 'orange',
  },
];
