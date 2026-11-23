import { Injectable, signal, computed } from '@angular/core';
import { BUSINESS_CONFIG, BusinessConfig } from '../config/business.config';
import { CartCalculation } from '../models/cart.model';

export interface BusinessStatus {
  isOpen: boolean;
  statusText: string;
  nextOpenTimeText: string;
  isAfterMidnight: boolean;
  currentTimeString: string;
  config: BusinessConfig;
}

@Injectable({
  providedIn: 'root'
})
export class BusinessStatusService {
  readonly config = BUSINESS_CONFIG;

  // Allows simulating time for testing/review purposes if needed
  private simulatedDate = signal<Date | null>(null);

  // Manual kitchen override ('auto' follows normal schedule, 'open' force opens, 'closed' force closes)
  kitchenOverride = signal<'auto' | 'open' | 'closed'>(this.loadKitchenOverride());

  // Current effective date (real or simulated)
  readonly effectiveDate = computed(() => {
    return this.simulatedDate() ?? new Date();
  });

  private loadKitchenOverride(): 'auto' | 'open' | 'closed' {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = localStorage.getItem('tbzb_kitchen_override');
        if (saved === 'open' || saved === 'closed' || saved === 'auto') {
          return saved;
        }
      }
    } catch (e) { }
    return 'auto';
  }

  setKitchenOverride(mode: 'auto' | 'open' | 'closed'): void {
    this.kitchenOverride.set(mode);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('tbzb_kitchen_override', mode);
      }
    } catch (e) { }
  }

  /**
   * Evaluates if business is currently open based on operating hours (10:00 AM to 1:00 AM next day)
   * or admin manual override.
   */
  readonly status = computed<BusinessStatus>(() => {
    const now = this.effectiveDate();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const totalMinutes = hours * 60 + minutes;

    // Normal schedule: Open from 10:00 AM (600 mins) through midnight, and 00:00 to 00:59 AM (< 60 mins)
    const scheduledOpen = totalMinutes >= 600 || totalMinutes < 60;
    const isAfterMidnight = hours === 0;

    const override = this.kitchenOverride();
    let isOpen = scheduledOpen;
    let statusText = isOpen ? 'Open Now' : 'Closed Now';

    if (override === 'open') {
      isOpen = true;
      statusText = 'Kitchen Open (Manual)';
    } else if (override === 'closed') {
      isOpen = false;
      statusText = 'Kitchen Paused (Admin)';
    }

    const timeFormatter = new Intl.DateTimeFormat('en-IN', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    const currentTimeString = timeFormatter.format(now);

    let nextOpenTimeText = '';
    if (!isOpen) {
      if (override === 'closed') {
        nextOpenTimeText = 'Temporarily paused by restaurant';
      } else {
        nextOpenTimeText = 'Opens today at 10:00 AM';
      }
    }

    return {
      isOpen,
      statusText,
      nextOpenTimeText,
      isAfterMidnight,
      currentTimeString,
      config: this.config
    };
  });

  /**
   * Calculate cart delivery fees and total according to TBZB midnight rules.
   */
  calculateCart(subtotal: number): CartCalculation {
    const currentStatus = this.status();
    const isAfterMidnight = currentStatus.isAfterMidnight;

    if (isAfterMidnight) {
      const deliveryCharge = this.config.deliverySettings.afterMidnightCharge; // ₹60
      return {
        subtotal,
        deliveryCharge,
        isAfterMidnight: true,
        deliveryChargeNote: '₹60 late-night delivery charge applied (12:00 AM – 1:00 AM).',
        total: subtotal + deliveryCharge,
        hasPendingDeliveryFee: false
      };
    } else {
      const charge = this.config.deliverySettings.beforeMidnightCharge ?? 50;
      return {
        subtotal,
        deliveryCharge: charge,
        isAfterMidnight: false,
        deliveryChargeNote: `Standard delivery: ₹${charge}`,
        total: subtotal + charge,
        hasPendingDeliveryFee: false
      };
    }
  }

  /**
   * Set simulated time for testing/reviewing operating and delivery charge modes.
   */
  setSimulatedTime(hours: number, minutes: number = 0): void {
    const d = new Date();
    d.setHours(hours, minutes, 0, 0);
    this.simulatedDate.set(d);
  }

  /**
   * Reset simulation back to real clock time.
   */
  resetSimulatedTime(): void {
    this.simulatedDate.set(null);
  }

  isSimulated(): boolean {
    return this.simulatedDate() !== null;
  }
}

