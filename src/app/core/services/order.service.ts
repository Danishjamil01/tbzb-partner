import { Injectable, signal, computed, inject } from '@angular/core';
import { KitchenOrder, OrderStatus, PaymentMethod } from '../models/order.model';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private toastService = inject(ToastService);
  private readonly FIRESTORE_BASE = 'https://firestore.googleapis.com/v1/projects/tbzb-bidar/databases/(default)/documents/tbzb_orders';
  private pollingTimer: any = null;
  private alarmIntervalTimer: any = null;
  private knownOrderIds = new Set<string>();

  // State signals
  orders = signal<KitchenOrder[]>(this.loadCachedOrders());
  isFetching = signal<boolean>(false);
  soundEnabled = signal<boolean>(this.loadSoundPreference());
  statusFilter = signal<'all' | 'new' | 'preparing' | 'out_for_delivery' | 'delivered'>('all');
  
  // High-priority Live Alarm State for New Incoming Orders
  isAlarmRinging = signal<boolean>(false);
  ringingOrderId = signal<string | null>(null);

  // Filtered orders list
  filteredOrders = computed(() => {
    const list = this.orders();
    const filter = this.statusFilter();
    if (filter === 'all') return list;
    return list.filter(o => o.status === filter);
  });

  // Summary counts
  newOrdersCount = computed(() => this.orders().filter(o => o.status === 'new').length);
  preparingCount = computed(() => this.orders().filter(o => o.status === 'preparing').length);
  outForDeliveryCount = computed(() => this.orders().filter(o => o.status === 'out_for_delivery').length);
  activeOrdersCount = computed(() =>
    this.orders().filter(o => o.status === 'new' || o.status === 'preparing' || o.status === 'out_for_delivery').length
  );
  deliveredCount = computed(() => this.orders().filter(o => o.status === 'delivered').length);

  constructor() {
    this.orders().forEach(o => this.knownOrderIds.add(o.orderId));
    this.fetchOrders(true);
    this.startPolling(8000); // 8-second real-time check
  }

  private loadCachedOrders(): KitchenOrder[] {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const data = localStorage.getItem('tbzb_partner_orders');
        if (data) {
          const parsed = JSON.parse(data);
          if (Array.isArray(parsed)) return parsed;
        }
      }
    } catch (e) {}
    return [];
  }

  private saveOrdersToCache(orders: KitchenOrder[]): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('tbzb_partner_orders', JSON.stringify(orders));
      }
    } catch (e) {}
  }

  private loadSoundPreference(): boolean {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const val = localStorage.getItem('tbzb_partner_sound');
        if (val !== null) return val === 'true';
      }
    } catch (e) {}
    return true;
  }

  toggleSound(): void {
    const next = !this.soundEnabled();
    this.soundEnabled.set(next);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('tbzb_partner_sound', String(next));
      }
    } catch (e) {}
    if (next) {
      this.playSingleChime();
      this.toastService.show('Order siren enabled 🔔', 'info');
    } else {
      this.stopAlarm();
      this.toastService.show('Order siren muted 🔕', 'info');
    }
  }

  /* ==========================================================================
     LOUD CONTINUOUS RESTAURANT SIREN (Zomato/Swiggy Style Audio Synthesizer)
     ========================================================================== */
  startAlarmLoop(orderId?: string): void {
    if (!this.soundEnabled()) return;
    if (orderId) this.ringingOrderId.set(orderId);
    this.isAlarmRinging.set(true);

    if (this.alarmIntervalTimer) clearInterval(this.alarmIntervalTimer);

    // Play immediately
    this.playSirenTone();

    // Loop every 1.5 seconds until accepted or dismissed
    this.alarmIntervalTimer = setInterval(() => {
      if (this.isAlarmRinging() && this.soundEnabled()) {
        this.playSirenTone();
      } else {
        this.stopAlarm();
      }
    }, 1500);
  }

  stopAlarm(): void {
    this.isAlarmRinging.set(false);
    this.ringingOrderId.set(null);
    if (this.alarmIntervalTimer) {
      clearInterval(this.alarmIntervalTimer);
      this.alarmIntervalTimer = null;
    }
  }

  /**
   * Loud 3-tone Restaurant Order Alert Siren + Vibration
   */
  private playSirenTone(): void {
    try {
      // Trigger mobile vibration
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([350, 150, 350, 150, 500]);
      }

      const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      // Tone 1: High piercing alarm (784 Hz - G5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(784, now);
      gain1.gain.setValueAtTime(0.5, now);
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      // Tone 2: Ultra-loud peak alarm (1046 Hz - C6)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'square';
      osc2.frequency.setValueAtTime(1046.5, now + 0.2);
      gain2.gain.setValueAtTime(0.55, now + 0.2);
      gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.65);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.2);
      osc2.stop(now + 0.65);

      // Tone 3: Resolving high bell (1318 Hz - E6)
      const osc3 = ctx.createOscillator();
      const gain3 = ctx.createGain();
      osc3.type = 'sine';
      osc3.frequency.setValueAtTime(1318.5, now + 0.45);
      gain3.gain.setValueAtTime(0.6, now + 0.45);
      gain3.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
      osc3.connect(gain3);
      gain3.connect(ctx.destination);
      osc3.start(now + 0.45);
      osc3.stop(now + 1.2);
    } catch (e) {
      // Audio playback blocked or not supported
    }
  }

  playSingleChime(): void {
    try {
      const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.5);
    } catch (e) {}
  }

  /* ==========================================================================
     FETCH ORDERS FROM FIRESTORE
     ========================================================================== */
  async fetchOrders(silent = false): Promise<void> {
    if (!silent) this.isFetching.set(true);

    try {
      const res = await fetch(this.FIRESTORE_BASE);
      if (!res.ok) {
        if (!silent) this.toastService.show('Could not connect to Cloud Firestore', 'warning');
        return;
      }

      const data = await res.json();
      const docs: any[] = data?.documents || [];

      let newestUnreadOrderId: string | null = null;

      const loadedOrders: KitchenOrder[] = docs.map(doc => {
        const fields = doc.fields || {};
        const orderId = fields.orderId?.stringValue || doc.name.split('/').pop();
        const status = (fields.status?.stringValue as OrderStatus) || 'new';

        if (!this.knownOrderIds.has(orderId) && status === 'new') {
          newestUnreadOrderId = orderId;
        }
        this.knownOrderIds.add(orderId);

        let items: any[] = [];
        try {
          if (fields.itemsJson?.stringValue) {
            items = JSON.parse(fields.itemsJson.stringValue);
          }
        } catch (e) {}

        return {
          orderId,
          createdAt: fields.createdAt?.stringValue || new Date().toISOString(),
          customerName: fields.customerName?.stringValue || 'Customer',
          mobileNumber: fields.mobileNumber?.stringValue || '',
          flatNumber: fields.flatNumber?.stringValue || '',
          areaLocality: fields.areaLocality?.stringValue || '',
          landmark: fields.landmark?.stringValue || '',
          googleMapsUrl: fields.googleMapsUrl?.stringValue || '',
          paymentMethod: (fields.paymentMethod?.stringValue as PaymentMethod) || 'cod',
          upiTransactionId: fields.upiTransactionId?.stringValue || '',
          items,
          subtotal: parseInt(fields.subtotal?.integerValue || '0', 10),
          deliveryCharge: parseInt(fields.deliveryCharge?.integerValue || '0', 10),
          total: parseInt(fields.total?.integerValue || '0', 10),
          status,
          updatedAt: fields.updatedAt?.stringValue
        };
      });

      loadedOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      this.orders.set(loadedOrders);
      this.saveOrdersToCache(loadedOrders);

      // Start ringing if any order is 'new' and unaccepted
      const pendingNewOrders = loadedOrders.filter(o => o.status === 'new');
      if (pendingNewOrders.length > 0 && !this.isAlarmRinging()) {
        this.startAlarmLoop(pendingNewOrders[0].orderId);
        this.toastService.show(`🚨 NEW ORDER #${pendingNewOrders[0].orderId} RECEIVED!`, 'success');
      } else if (!silent) {
        this.toastService.show('Orders refreshed', 'info');
      }
    } catch (err) {
      console.error('Fetch orders error:', err);
    } finally {
      if (!silent) this.isFetching.set(false);
    }
  }

  /* ==========================================================================
     ORDER STATUS ACTIONS
     ========================================================================== */
  async acceptOrder(orderId: string): Promise<void> {
    this.stopAlarm();
    await this.updateOrderStatus(orderId, 'preparing');
  }

  async markOutForDelivery(orderId: string): Promise<void> {
    await this.updateOrderStatus(orderId, 'out_for_delivery');
  }

  async markDelivered(orderId: string): Promise<void> {
    await this.updateOrderStatus(orderId, 'delivered');
  }

  async cancelOrder(orderId: string): Promise<void> {
    this.stopAlarm();
    await this.updateOrderStatus(orderId, 'cancelled');
  }

  async updateOrderStatus(orderId: string, newStatus: OrderStatus): Promise<boolean> {
    const current = this.orders();
    const updated = current.map(o => {
      if (o.orderId === orderId) {
        return { ...o, status: newStatus, updatedAt: new Date().toISOString() };
      }
      return o;
    });
    this.orders.set(updated);
    this.saveOrdersToCache(updated);

    const statusLabels: Record<OrderStatus, string> = {
      new: 'New Order',
      preparing: 'Accepted & Preparing in Kitchen 👨‍🍳',
      out_for_delivery: 'Dispatched (Out for Delivery) 🛵',
      delivered: 'Delivered Successfully ✅',
      cancelled: 'Order Cancelled ❌'
    };

    this.toastService.show(`Order #${orderId} marked as ${statusLabels[newStatus]}`, 'success');

    try {
      const payload = {
        fields: {
          status: { stringValue: newStatus },
          updatedAt: { stringValue: new Date().toISOString() }
        }
      };

      const url = `${this.FIRESTORE_BASE}/${orderId}?updateMask.fieldPaths=status&updateMask.fieldPaths=updatedAt`;
      await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return true;
    } catch (err) {
      console.error('Failed to update status in cloud:', err);
      return false;
    }
  }

  /* ==========================================================================
     POLLING
     ========================================================================== */
  startPolling(intervalMs = 8000): void {
    if (this.pollingTimer) return;
    this.pollingTimer = setInterval(() => {
      this.fetchOrders(true);
    }, intervalMs);
  }

  stopPolling(): void {
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = null;
    }
  }
}
