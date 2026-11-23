import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KitchenOrder } from '../../core/models/order.model';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { InrPipe } from '../../shared/pipes/inr.pipe';

@Component({
  selector: 'app-receipt-modal',
  standalone: true,
  imports: [CommonModule, IconComponent, InrPipe],
  template: `
    @if (isOpen && order) {
      <div class="receipt-backdrop" (click)="close.emit()">
        <div class="receipt-container" (click)="$event.stopPropagation()">
          <!-- Action Buttons Bar -->
          <div class="receipt-actions no-print">
            <button class="btn-print" (click)="printReceipt()">
              <app-icon name="printer" [size]="18" />
              <span>Print Slip</span>
            </button>
            <button class="btn-close" (click)="close.emit()" title="Close">
              <app-icon name="x" [size]="20" />
            </button>
          </div>

          <!-- Printable Thermal Receipt Slip (58mm/80mm optimized) -->
          <div class="thermal-receipt" id="printable-receipt">
            <div class="receipt-header">
              <h2 class="restaurant-name">THE BITE ZONE</h2>
              <p class="tagline">Cloud Kitchen • Bidar</p>
              <p class="meta">Contact: +91 80504 59005</p>
              <div class="divider-dashed"></div>
            </div>

            <div class="receipt-order-meta">
              <div class="row">
                <span class="label">Order ID:</span>
                <span class="val bold">#{{ order.orderId }}</span>
              </div>
              <div class="row">
                <span class="label">Date/Time:</span>
                <span class="val">{{ formatDateTime(order.createdAt) }}</span>
              </div>
              <div class="row">
                <span class="label">Payment:</span>
                <span class="val bold uppercase">{{ order.paymentMethod === 'cod' ? 'CASH ON DELIVERY' : 'ONLINE (PAID)' }}</span>
              </div>
              @if (order.upiTransactionId) {
                <div class="row">
                  <span class="label">Txn ID:</span>
                  <span class="val">{{ order.upiTransactionId }}</span>
                </div>
              }
              <div class="divider-dashed"></div>
            </div>

            <div class="receipt-customer">
              <p class="bold">{{ order.customerName }}</p>
              <p class="bold">📞 {{ order.mobileNumber }}</p>
              <p class="address">{{ order.flatNumber }}, {{ order.areaLocality }}</p>
              @if (order.landmark) {
                <p class="landmark">Landmark: {{ order.landmark }}</p>
              }
              <div class="divider-dashed"></div>
            </div>

            <!-- Items Table -->
            <div class="receipt-items">
              <div class="items-head">
                <span class="col-item">ITEM</span>
                <span class="col-qty">QTY</span>
                <span class="col-amt">AMT</span>
              </div>
              <div class="divider-solid"></div>

              @for (item of order.items; track item.name) {
                <div class="item-row">
                  <span class="col-item">{{ item.name }}</span>
                  <span class="col-qty">x{{ item.quantity }}</span>
                  <span class="col-amt">₹{{ item.price * item.quantity }}</span>
                </div>
              }
              <div class="divider-solid"></div>
            </div>

            <!-- Totals -->
            <div class="receipt-totals">
              <div class="row">
                <span>Subtotal</span>
                <span>₹{{ order.subtotal }}</span>
              </div>
              <div class="row">
                <span>Delivery Fee</span>
                <span>₹{{ order.deliveryCharge }}</span>
              </div>
              <div class="divider-dashed"></div>
              <div class="row grand-total">
                <span class="bold">GRAND TOTAL</span>
                <span class="bold">₹{{ order.total }}</span>
              </div>
              <div class="divider-dashed"></div>
            </div>

            <div class="receipt-footer">
              <p class="thank-you">Thank you for ordering with us!</p>
              <p class="signature">Taste the Perfection • TBZB</p>
            </div>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .receipt-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(4px);
      z-index: 99999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
    }

    .receipt-container {
      background: #ffffff;
      border-radius: 12px;
      max-width: 380px;
      width: 100%;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.35);
      display: flex;
      flex-direction: column;
    }

    .receipt-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      background: #111827;
      color: #fff;
      border-radius: 12px 12px 0 0;
    }

    .btn-print {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: #10b981;
      color: #fff;
      border: none;
      padding: 8px 16px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 14px;
      cursor: pointer;
      &:active { transform: scale(0.97); }
    }

    .btn-close {
      background: transparent;
      border: none;
      color: #9ca3af;
      cursor: pointer;
      display: flex;
      align-items: center;
      &:hover { color: #fff; }
    }

    /* Thermal Receipt Styling */
    .thermal-receipt {
      padding: 20px 16px;
      font-family: 'Courier New', Courier, monospace;
      color: #000;
      background: #fff;
      font-size: 13px;
      line-height: 1.4;
    }

    .receipt-header {
      text-align: center;
      .restaurant-name {
        font-size: 18px;
        font-weight: 900;
        margin: 0;
        letter-spacing: 1px;
      }
      .tagline { margin: 2px 0; font-size: 12px; }
      .meta { margin: 2px 0 8px; font-size: 11px; }
    }

    .divider-dashed {
      border-bottom: 1px dashed #000;
      margin: 8px 0;
    }

    .divider-solid {
      border-bottom: 1px solid #000;
      margin: 6px 0;
    }

    .receipt-order-meta, .receipt-customer, .receipt-totals {
      .row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 3px;
      }
      .bold { font-weight: bold; }
      .uppercase { text-transform: uppercase; }
      .address { margin: 2px 0; font-size: 12px; }
      .landmark { font-size: 11px; font-style: italic; }
    }

    .items-head {
      display: flex;
      font-weight: bold;
      font-size: 12px;
      .col-item { flex: 1; }
      .col-qty { width: 40px; text-align: center; }
      .col-amt { width: 60px; text-align: right; }
    }

    .item-row {
      display: flex;
      font-size: 12px;
      margin-bottom: 4px;
      .col-item { flex: 1; word-break: break-word; }
      .col-qty { width: 40px; text-align: center; }
      .col-amt { width: 60px; text-align: right; }
    }

    .grand-total {
      font-size: 16px;
      font-weight: bold;
    }

    .receipt-footer {
      text-align: center;
      margin-top: 10px;
      font-size: 11px;
      .thank-you { font-weight: bold; margin: 0 0 2px; }
      .signature { margin: 0; }
    }

    /* Print styles */
    @media print {
      body * {
        visibility: hidden;
      }
      .receipt-backdrop {
        position: static;
        background: none;
        padding: 0;
      }
      .no-print {
        display: none !important;
      }
      #printable-receipt, #printable-receipt * {
        visibility: visible;
      }
      #printable-receipt {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        max-width: 80mm;
        margin: 0;
        padding: 4mm;
      }
    }
  `]
})
export class ReceiptModalComponent {
  @Input() isOpen = false;
  @Input() order: KitchenOrder | null = null;
  @Output() close = new EventEmitter<void>();

  printReceipt(): void {
    if (typeof window !== 'undefined') {
      window.print();
    }
  }

  formatDateTime(iso: string): string {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (e) {
      return iso;
    }
  }
}
