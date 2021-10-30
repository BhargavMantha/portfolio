import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit {
  @ViewChild('mobileMenuButton', { static: true })
  mobileMenuButton!: ElementRef<HTMLDivElement>;

  @ViewChild('mobileMenu', { static: true })
  mobileMenu!: ElementRef<HTMLDivElement>;

  constructor() {}

  ngOnInit(): void {}
  toggle($event: any) {
    console.log('clicked');
    this.mobileMenu.nativeElement.classList.toggle('hidden');
  }
}
