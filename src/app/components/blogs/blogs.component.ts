import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-blogs',
  templateUrl: './blogs.component.html',
  styleUrls: ['./blogs.component.scss'],
})
export class BlogsComponent implements OnInit {
  constructor() {}
  blogPosts = [
    {
      url: 'https://dev.to/bhargavmantha/errors-555e',
      title: 'Errors my thought process',
    },
    {
      url: 'https://dev.to/bhargavmantha/running-the-stored-procedure-from-nestjs-gj0',
      title: 'Running the stored procedure from NestJs',
    },
    {
      url: 'https://dev.to/bhargavmantha/secret-to-configuring-the-best-postgres-nest-project-part-1-42n4',
      title: 'configure the best Postgres-Nest project',
    },
    {
      url: 'https://dev.to/bhargavmantha/connecting-to-rds-using-dbaver-nni',
      title: 'Connecting to RDS, Using DBeaver',
    },
    {
      url: 'https://dev.to/bhargavmantha/the-secret-to-configuring-eslint-prettier-prettier-eslint-plugin-in-vscode-for-angular-ts-and-js-project-51la',
      title: 'configure eslint, prettier, prettier-eslint',
    },
    {
      url: 'https://medium.com/@manthabhargav/clone-private-repositories-github-linux-1da5a0306da7',
      title: 'Clone Private Repositories (GITHUB/LINUX)',
    },
    {
      url: 'https://medium.com/@manthabhargav/clean-code-fdd31c56d665',
      title: 'Clean Code my thought process',
    },
    {
      url: 'https://medium.com/@manthabhargav/secret-to-reverse-tracking-social-media-account-7cc8ff0c61a1',
      title: 'Reverse Tracking Social Media Account',
    },
    {
      url: 'https://medium.com/@manthabhargav/barrier-on-opensuse-and-windows-10-181c7ac5cfec',
      title: 'Barrier On OpenSUSE and Windows 10',
    },
  ];
  ngOnInit(): void {}
}
