import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { DarkModeService } from '../../services/dark-mode.service';

@Component({
  selector: 'app-theme-toggle',
  templateUrl: './theme-toggle.component.html',
  styleUrls: ['./theme-toggle.component.scss'],
})
export class ThemeToggleComponent implements OnInit {
  @ViewChild('ball', { static: true })
  ball!: ElementRef<HTMLDivElement>;

  darkModeEnabled$ = this.darkModeService.darkModeEnabled$;

  private unsubscribe$ = new Subject();

  constructor(private darkModeService: DarkModeService) {}

  ngOnInit(): void {
    this.darkModeEnabled$.pipe(takeUntil(this.unsubscribe$));
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next(true);
    this.unsubscribe$.complete();
  }

  toggleDarkMode($event: any): void {
    const checked = $event.srcElement.checked;
    if (checked === true)
      this.ball.nativeElement.setAttribute(
        'style',
        'transform:translatex(100%);'
      );
    if (checked === false)
      this.ball.nativeElement.setAttribute(
        'style',
        'transform:translatex(0%);'
      );

    this.darkModeService.toggleDarkMode();
  }
}
