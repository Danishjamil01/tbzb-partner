import { Component, OnInit, signal, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-splash-screen',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './splash-screen.component.html',
  styleUrl: './splash-screen.component.scss'
})
export class SplashScreenComponent implements OnInit, OnDestroy {
  @Output() splashFinished = new EventEmitter<void>();

  isVisible = signal<boolean>(true);
  isFadingOut = signal<boolean>(false);
  private timer: any = null;

  ngOnInit(): void {
    this.updateThemeColor('#FFFFFF');

    // 2.2 seconds display time for snappy fast loading
    this.timer = setTimeout(() => {
      this.dismiss();
    }, 2200);
  }

  dismiss(): void {
    if (this.isFadingOut()) return;
    this.isFadingOut.set(true);

    setTimeout(() => {
      this.isVisible.set(false);
      this.splashFinished.emit();
    }, 350);
  }

  private updateThemeColor(color: string): void {
    if (typeof document !== 'undefined') {
      const metaTheme = document.querySelector('meta[name="theme-color"]');
      if (metaTheme) {
        metaTheme.setAttribute('content', color);
      }
    }
  }

  ngOnDestroy(): void {
    if (this.timer) {
      clearTimeout(this.timer);
    }
  }
}
