import {
  mobile,
  backend,
  creator,
  web,
  javascript,
  typescript,
  reactjs,
  nodejs,
  mongodb,
  git,
  grpc,
  aws,
  rxjs,
  angular,
  docker,
  deliverySolutions,
  shopify,
  carrent,
  jobit,
  tripguide,
  piratesAlert,
  irislogic,
  threejs,
  nestjs,
  typeorm,
} from '../assets';

export const navLinks = [
  {
    id: 'about',
    title: 'About',
  },
  {
    id: 'work',
    title: 'Work',
  },
  {
    id: 'experience',
    title: 'Experience',
  },
];

const services = [
  {
    title: 'Backend Developer',
    icon: web,
  },
  {
    title: 'Web Developer',
    icon: mobile,
  },
  {
    title: 'Infra',
    icon: backend,
  },
  {
    title: 'Blogger',
    icon: creator,
  },
];

const technologies = [
  {
    name: 'JavaScript',
    icon: javascript,
  },
  {
    name: 'Node JS',
    icon: nodejs,
  },
  {
    name: 'TypeScript',
    icon: typescript,
  },
  {
    name: 'React JS',
    icon: reactjs,
  },
  {
    name: 'Angular',
    icon: angular,
  },
  {
    name: 'NestJS',
    icon: nestjs,
  },
  {
    name: 'typeorm',
    icon: typeorm,
  },
  {
    name: 'RxJS',
    icon: rxjs,
  },
  {
    name: 'gRPC',
    icon: grpc,
  },
  {
    name: 'AWS',
    icon: aws,
  },
  {
    name: 'MongoDB',
    icon: mongodb,
  },
  {
    name: 'Three JS',
    icon: threejs,
  },
  {
    name: 'git',
    icon: git,
  },
  {
    name: 'docker',
    icon: docker,
  },
];

const experiences = [
  {
    title: 'Full stack Developer',
    company_name: 'Freelance',
    icon: shopify,
    iconBg: '#E6DEDD',
    date: 'Jan 2017 - Dec 2017',
    points: [
      'Developed websites, chat-bots, and models which could converse based on speech using HTML Canvas, Google speech recognition, and Python to generate the animated models.',
      'Reduced the cost by using AWS poly to generate speech from text and patch the same to the model',
      'Created a Phone Bot using Twilio and Node.JS',
      'Created a Facebook messenger and WhatsApp Bot.',
    ],
  },
  {
    title: ' Software Engineer(Remote)',
    company_name: 'Pirates Alert',
    icon: piratesAlert,
    iconBg: '#383E56',
    date: 'Jan 2018 - Aug 2020',
    points: [
      'Created an application for detecting/reporting pirated content online currently in use by 4 companies.',
      'The Technologies used were: Node.js, Cypress, Python, Angular, React, Basic machine learning algorithms, FFMPEG, GCP, Jenkins, and Google Vision/Tesseract for image recognition.',
    ],
  },
  {
    title: 'Programmer Analyst (Remote)',
    company_name: 'Irislogic',
    icon: irislogic,
    iconBg: '#E6DEDD',
    date: 'Aug 2020 - Mar 2022',
    points: [
      'Implemented, shipped, and operated over 40 microservices that can handle loads up to 100 QPS.',
      'Improved the validation from 10 minutes to 2 Minutes using AJV for CSVs to be inserted into DB.',
      'Coded several universal microservice using AWS (SQS, SNS, SES, serverless) and Nest. JS consumed by 6 other microservices..',
      'Reduced support tickets by 70% for a large client by taking charge of reworking, and error handling, ensuring 100% error code mapping with appropriate HTTP codes and triggering Nest.JS restful API exceptions for non-mapped error codes.',
      'Built the entire user management backend with MFA using Passport+JWT capable of handling 300 users at 1 go.',
      'Consolidated the view APIs end to end using the TypeORM feature delivering the product in 12 days. ',
      'Devices CICD pipelines for 0 down time and 20X faster deployment and delivery',
      'Translated business logic to code bridging the gap between client and developer improving the timeline by 5 days.',
      'Restructured applications using Node.JS clusters, Kubernetes for scaling, and 0 downtime',
    ],
  },
  {
    title: 'Senior Software Engineer (Remote)',
    company_name: 'Delivery Solutions',
    icon: deliverySolutions,
    iconBg: '#383E56',
    date: 'Mar 2022 - Present',
    points: [
      'Built services to handle up 600 TPS of load',
      `Built an Object Data Mapping library to connect with Cassandra that establishes a connection with Cassandra
       using “express-cassandra” syncing the entities following 2 main patterns: Domain Driven Design
       and repository pattern.`,
      'Refactored monolithic architecture code to domain-based entity-level microservices improving the performance by 48%.',
      'Engineered a load-balancer service which distributes the load on the main service by calculating the number of ECS task definitions in the cluster and steps up / down the requests on the main server, this internally improved the performance by 73% and reduced the cost by 34%.',
    ],
  },
];

const testimonials = [
  {
    testimonial:
      'I thought it was impossible to make a website as beautiful as our product, but Rick proved me wrong.',
    name: 'Sara Lee',
    designation: 'CFO',
    company: 'Acme Co',
    image: 'https://randomuser.me/api/portraits/women/4.jpg',
  },
  {
    testimonial:
      "I've never met a web developer who truly cares about their clients' success like Rick does.",
    name: 'Chris Brown',
    designation: 'COO',
    company: 'DEF Corp',
    image: 'https://randomuser.me/api/portraits/men/5.jpg',
  },
  {
    testimonial:
      "After Rick optimized our website, our traffic increased by 50%. We can't thank them enough!",
    name: 'Lisa Wang',
    designation: 'CTO',
    company: '456 Enterprises',
    image: 'https://randomuser.me/api/portraits/women/6.jpg',
  },
];

const projects = [
  {
    name: 'Athena-Programming Language',
    description:
      'Started with this project to learn the concepts of compiler design, Abstract Syntax tree, Lexical, Grammer, SOLID design principles, and Design patterns applicable to any programming language.',
    tags: [
      {
        name: 'nestjs',
        color: 'green-text-gradient',
      },
      {
        name: 'rxjs',
        color: 'pink-text-gradient',
      },
    ],
    image: carrent,
    source_code_link: 'https://github.com/BhargavMantha/athena-programming-language.',
  },
  {
    name: 'WEB3-ETH transaction portal',
    description:
      'This is a decentralized, distributed, and transparent web that is powered by blockchain technology and smart contracts.This Web3 projects aims to create applications and services that are more secure',
    tags: [
      {
        name: 'angular',
        color: 'red-text-gradient',
      },
      {
        name: 'restapi',
        color: 'green-text-gradient',
      },
      {
        name: 'rxjs',
        color: 'pink-text-gradient',
      },
    ],
    image: jobit,
    source_code_link: 'https://github.com/',
  },
];

export { services, technologies, experiences, testimonials, projects };
