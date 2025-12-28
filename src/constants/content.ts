export const PROFILE = {
  name: 'Bhargav Mantha',
  title: 'Technical Lead',
  tagline: 'I Build Systems That Scale',
  description: 'Enterprise-grade microservices architecture for companies that move fast',
  email: 'manthabhargav@gmail.com',
  github: 'https://github.com/BhargavMantha',
  linkedin: 'https://linkedin.com/in/bhargavmantha',
  blog: 'https://dev.to/bhargavmantha',
};

export const METRICS = [
  { value: '800+', label: 'TPS', color: '#00cea8' },
  { value: '40+', label: 'Microservices', color: '#f272c8' },
  { value: '73%', label: 'Performance ↑', color: '#00ff88' },
  { value: '14', label: 'Zero-Downtime', color: '#915EFF' },
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
      'Architected high-performance microservices handling 800+ TPS',
      '73% performance boost and 34% cost reduction',
      'Led 4 epic-level initiatives delivering 100 issues across 20 major projects',
    ],
    tags: ['NestJS', 'AWS', 'TypeORM', 'Docker', 'Kubernetes'],
  },
  {
    company: 'Irislogic',
    role: 'Programmer Analyst',
    period: 'Aug 2020 - Mar 2022',
    location: 'Santa Clara, CA (Remote)',
    achievements: [
      'Implemented 40+ microservices handling 100 QPS',
      'Reduced support tickets by 70% for large client',
      'Built user management backend with MFA for 300 users',
    ],
    tags: ['Node.js', 'AWS', 'NestJS'],
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
