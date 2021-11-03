import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-skills',
  templateUrl: './skills.component.html',
  styleUrls: ['./skills.component.scss'],
})
export class SkillsComponent implements OnInit {
  todaysDate = new Date();
  constructor() {}
  getDate() {
    let today = new Date();
    let dd = String(today.getDate()).padStart(2, '0');
    let mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    let yyyy = today.getFullYear();
    return mm + '/' + dd + '/' + yyyy;
  }

  imagesObject = [
    {
      alt: 'Visual Studio Code',
      url: 'https://raw.githubusercontent.com/github/explore/80688e429a7d4ef2fca1e82350fe8e3517d3494d/topics/visual-studio-code/visual-studio-code.png',
    },
    {
      alt: 'HTML5',
      url: 'https://raw.githubusercontent.com/github/explore/80688e429a7d4ef2fca1e82350fe8e3517d3494d/topics/html/html.png',
    },
    {
      alt: 'CSS3',
      url: 'https://raw.githubusercontent.com/github/explore/80688e429a7d4ef2fca1e82350fe8e3517d3494d/topics/css/css.png',
    },
    {
      alt: 'Sass',
      url: 'https://raw.githubusercontent.com/github/explore/80688e429a7d4ef2fca1e82350fe8e3517d3494d/topics/sass/sass.png',
    },
    {
      alt: 'JavaScript',
      url: 'https://raw.githubusercontent.com/github/explore/80688e429a7d4ef2fca1e82350fe8e3517d3494d/topics/javascript/javascript.png',
    },
    {
      alt: 'Angular',
      url: 'https://cdn.worldvectorlogo.com/logos/angular-icon.svg',
    },
    { alt: 'GRPC', url: 'https://grpc.io/img/logos/grpc-icon-color.png' },
    {
      alt: 'NestJs',
      url: 'https://cdn.dribbble.com/users/808903/screenshots/3831862/dribbble_szablon__1_1.png',
    },
    {
      alt: 'TypeScript',
      url: 'https://cdn.iconscout.com/icon/free/png-512/typescript-1174965.png',
    },
    {
      alt: 'RxJS',
      url: 'https://miro.medium.com/max/1200/1*hj71wy_fVD1qIG8q9mnPjg.png',
    },
    {
      alt: 'AWS',
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/Amazon_Web_Services_Logo.svg/1024px-Amazon_Web_Services_Logo.svg.png',
    },
    {
      alt: 'GraphQL',
      url: 'https://raw.githubusercontent.com/github/explore/80688e429a7d4ef2fca1e82350fe8e3517d3494d/topics/graphql/graphql.png',
    },
    {
      alt: 'Node.js',
      url: 'https://raw.githubusercontent.com/github/explore/80688e429a7d4ef2fca1e82350fe8e3517d3494d/topics/nodejs/nodejs.png',
    },
    {
      alt: 'SQL',
      url: 'https://raw.githubusercontent.com/github/explore/80688e429a7d4ef2fca1e82350fe8e3517d3494d/topics/sql/sql.png',
    },
    {
      alt: 'MySQL',
      url: 'https://raw.githubusercontent.com/github/explore/80688e429a7d4ef2fca1e82350fe8e3517d3494d/topics/mysql/mysql.png',
    },
    {
      alt: 'MongoDB',
      url: 'https://raw.githubusercontent.com/github/explore/80688e429a7d4ef2fca1e82350fe8e3517d3494d/topics/mongodb/mongodb.png',
    },
    {
      alt: 'Git',
      url: 'https://raw.githubusercontent.com/github/explore/80688e429a7d4ef2fca1e82350fe8e3517d3494d/topics/git/git.png',
    },
    {
      alt: 'GitHub',
      url: 'https://raw.githubusercontent.com/github/explore/78df643247d429f6cc873026c0622819ad797942/topics/github/github.png',
    },
    {
      alt: 'Terminal',
      url: 'https://cdn.dribbble.com/users/593486/screenshots/3598699/1024.jpg?compress=1&resize=400x300',
    },
    {
      alt: 'Linux',
      url: 'https://cdn.freebiesupply.com/images/thumbs/2x/linux-logo.png',
    },
    {
      alt: 'Manjaro',
      url: 'https://cdn.freelogovectors.net/wp-content/uploads/2019/03/Manjarologo.png',
    },
  ];
  ngOnInit(): void {}
}
