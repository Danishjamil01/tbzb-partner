import { CartItem, CartCalculation } from './cart.model';

export type OrderType = 'delivery' | 'pickup';
export type PaymentMethod = 'cod' | 'upi';
export type OrderStatus = 'new' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled';

export interface CustomerDetails {
  fullName: string;
  mobileNumber: string;
  orderType: OrderType;
  flatNumber: string;
  areaLocality: string;
  landmark?: string;
  deliveryInstructions?: string;
  paymentMethod: PaymentMethod;
  locationCoordinates?: { lat: number; lng: number };
  googleMapsUrl?: string;
  upiTransactionId?: string;
}

export interface PlacedOrder {
  orderId: string;
  timestamp: Date;
  customer: CustomerDetails;
  items: CartItem[];
  calculation: CartCalculation;
  formattedWhatsAppMessage: string;
  whatsAppUrl: string;
}

export interface KitchenOrderItem {
  dishId: string;
  name: string;
  price: number;
  quantity: number;
  total: number;
}

export interface KitchenOrder {
  orderId: string;
  createdAt: string;
  customerName: string;
  mobileNumber: string;
  flatNumber: string;
  areaLocality: string;
  landmark?: string;
  googleMapsUrl?: string;
  paymentMethod: PaymentMethod;
  upiTransactionId?: string;
  items: KitchenOrderItem[];
  subtotal: number;
  deliveryCharge: number;
  total: number;
  status: OrderStatus;
  updatedAt?: string;
  notes?: string;
}


