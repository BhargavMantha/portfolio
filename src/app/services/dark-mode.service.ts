import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

const DARK_MODE_ENABLED_KEY = 'darkModeEnabled';
const ENABLED_VALUE = 'true';
const NOT_ENABLED_VALUE = 'false';

@Injectable({
  providedIn: 'root',
})
export class DarkModeService implements OnDestroy {
  darkModeEnabled$ = new BehaviorSubject(false);

  constructor() {
    this.setCurrentState();
    this.updateLocalStorageOnStateChange();
  }

  ngOnDestroy(): void {
    this.darkModeEnabled$.complete();
  }

  toggleDarkMode(): void {
    const currentValue = this.darkModeEnabled$.value;
    this.darkModeEnabled$.next(!currentValue);
  }

  private setCurrentState(): void {
    const currentValue = localStorage.getItem(DARK_MODE_ENABLED_KEY);
    const htmlTag = document.getElementsByTagName('html').item(0);
    const classList = htmlTag?.classList;

    if (currentValue === ENABLED_VALUE) {
      this.darkModeEnabled$.next(true);
      classList?.add('dark');
    } else if (currentValue === NOT_ENABLED_VALUE) {
      this.darkModeEnabled$.next(false);
      classList?.remove('dark');
    }
  }

  private updateLocalStorageOnStateChange(): void {
    this.darkModeEnabled$.subscribe((enabled) => {
      const htmlTag = document.getElementsByTagName('html').item(0);
      const classList = htmlTag?.classList;

      if (enabled) {
        localStorage.setItem(DARK_MODE_ENABLED_KEY, 'true');
        classList?.add('dark');
      } else {
        localStorage.setItem(DARK_MODE_ENABLED_KEY, 'false');
        classList?.remove('dark');
      }
    });
  }
}
