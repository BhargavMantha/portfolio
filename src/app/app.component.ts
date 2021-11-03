import { isDevMode, Component, OnInit } from '@angular/core';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  ngOnInit(): void {}
  title = 'Bhargav';
  constructor() {
    if (isDevMode()) {
      console.log('👋 in Development! mode');
    } else {
      console.log('💪 Production!');
    }
  }
}
