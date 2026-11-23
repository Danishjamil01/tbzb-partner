import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../core/services/toast.service';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="toast-container" aria-live="polite">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="toast-card" [ngClass]="toast.type">
          <div class="toast-icon">
            @switch (toast.type) {
              @case ('success') {
                <app-icon name="check" [size]="18" />
              }
              @case ('error') {
                <app-icon name="alert-circle" [size]="18" />
              }
              @case ('warning') {
                <app-icon name="alert-circle" [size]="18" />
              }
              @default {
                <app-icon name="info" [size]="18" />
              }
            }
          </div>
          <div class="toast-content">
            @if (toast.title) {
              <div class="toast-title">{{ toast.title }}</div>
            }
            <div class="toast-message">{{ toast.message }}</div>
          </div>
          <button class="toast-close" (click)="toastService.remove(toast.id)" aria-label="Close notification">
            <app-icon name="x" [size]="14" />
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 84px;
      right: 20px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-width: 380px;
      width: calc(100vw - 40px);
      pointer-events: none;
    }

    .toast-card {
      pointer-events: auto;
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px 14px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
      color: #0f172a;
      animation: slideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);

      &.success {
        border-left: 4px solid #16a34a;
        .toast-icon { color: #16a34a; }
      }
      &.error {
        border-left: 4px solid #dc2626;
        .toast-icon { color: #dc2626; }
      }
      &.warning {
        border-left: 4px solid #d97706;
        .toast-icon { color: #d97706; }
      }
      &.info {
        border-left: 4px solid #2563eb;
        .toast-icon { color: #2563eb; }
      }
    }

    .toast-icon {
      margin-top: 1px;
      flex-shrink: 0;
    }

    .toast-content {
      flex: 1;
      font-size: 13.5px;
      line-height: 1.4;
    }

    .toast-title {
      font-weight: 700;
      margin-bottom: 2px;
      color: #0f172a;
    }

    .toast-message {
      color: #475569;
    }

    .toast-close {
      color: #94a3b8;
      background: transparent;
      border: none;
      cursor: pointer;
      padding: 2px;
      border-radius: 4px;
      transition: color 0.15s;

      &:hover {
        color: #0f172a;
      }
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(-8px) scale(0.97);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }
  `]
})
export class ToastContainerComponent {
  toastService = inject(ToastService);
}

