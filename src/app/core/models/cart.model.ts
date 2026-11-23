import { MenuItem } from './menu.model';

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  notes?: string;
}

export interface CartCalculation {
  subtotal: number;
  deliveryCharge: number | null; // null if unconfirmed
  isAfterMidnight: boolean;
  deliveryChargeNote: string;
  total: number; // subtotal + (deliveryCharge ?? 0)
  hasPendingDeliveryFee: boolean;
}

