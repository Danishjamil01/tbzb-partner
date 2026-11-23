import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IconComponent } from './shared/components/icon/icon.component';
import { ToastContainerComponent } from './shared/components/toast/toast.component';
import { InrPipe } from './shared/pipes/inr.pipe';
import { ReceiptModalComponent } from './features/receipt/receipt-modal.component';

import { OrderService } from './core/services/order.service';
import { MenuService } from './core/services/menu.service';
import { BusinessStatusService } from './core/services/business-status.service';
import { AdminService } from './core/services/admin.service';
import { ToastService } from './core/services/toast.service';
import { KitchenOrder, OrderStatus } from './core/models/order.model';
import { MenuItem, FoodCategory } from './core/models/menu.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IconComponent,
    ToastContainerComponent,
    InrPipe,
    ReceiptModalComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit, OnDestroy {
  orderService = inject(OrderService);
  menuService = inject(MenuService);
  statusService = inject(BusinessStatusService);
  adminService = inject(AdminService);
  toastService = inject(ToastService);

  // Active Screen Tab
  activeTab = signal<'orders' | 'menu' | 'store' | 'settings'>('orders');

  // Login PIN Form
  pinInput = '';
  rememberMe = true;
  showPassword = false;
  isLockedOut = computed(() => this.adminService.lockoutUntil() > Date.now());

  // Receipt Modal
  selectedReceiptOrder = signal<KitchenOrder | null>(null);
  isReceiptModalOpen = signal<boolean>(false);

  // Dish Search & Category Filter
  dishSearch = '';
  selectedCategory: FoodCategory = 'all';
  availabilityFilter: 'all' | 'in-stock' | 'sold-out' = 'all';

  // Dish Add/Edit Modal
  isDishModalOpen = signal<boolean>(false);
  isNewDish = signal<boolean>(false);
  editingDish: MenuItem = this.getEmptyDish();
  imageTab: 'gallery' | 'camera' | 'url' = 'gallery';
  isProcessingImage = false;

  // New PIN Form
  newPinInput = '';
  confirmPinInput = '';

  // Categories list
  categories = this.menuService.categories;

  // Filtered dishes
  filteredDishes = computed(() => {
    const all = this.menuService.allItems();
    const search = this.dishSearch.trim().toLowerCase();
    const cat = this.selectedCategory;
    const avail = this.availabilityFilter;

    return all.filter(dish => {
      const matchCat = cat === 'all' || dish.category === cat;
      const matchSearch = !search ||
        dish.name.toLowerCase().includes(search) ||
        dish.description.toLowerCase().includes(search);
      const matchAvail = avail === 'all' ||
        (avail === 'in-stock' && dish.isAvailable) ||
        (avail === 'sold-out' && !dish.isAvailable);

      return matchCat && matchSearch && matchAvail;
    });
  });

  inStockCount = computed(() => this.menuService.allItems().filter(d => d.isAvailable).length);
  soldOutCount = computed(() => this.menuService.allItems().filter(d => !d.isAvailable).length);

  ngOnInit(): void {
    // If not authenticated, default to true if remember me was saved
    if (this.adminService.isAuthenticated()) {
      this.orderService.startPolling(8000);
      this.adminService.syncFromCloud(false);
    }
  }

  ngOnDestroy(): void {
    this.orderService.stopPolling();
    this.orderService.stopAlarm();
  }

  /* ==========================================================================
     AUTH
     ========================================================================== */
  async onLogin(): Promise<void> {
    if (!this.pinInput.trim()) {
      this.toastService.show('Please enter your partner admin PIN', 'warning');
      return;
    }
    const success = await this.adminService.login(this.pinInput, this.rememberMe);
    if (success) {
      this.pinInput = '';
      this.orderService.startPolling(8000);
      this.adminService.syncFromCloud(false);
      this.activeTab.set('orders');
    }
  }

  onLogout(): void {
    this.adminService.logout();
    this.orderService.stopAlarm();
  }

  /* ==========================================================================
     ORDER ACTIONS
     ========================================================================== */
  async acceptOrder(order: KitchenOrder): Promise<void> {
    await this.orderService.acceptOrder(order.orderId);
  }

  async markOutForDelivery(order: KitchenOrder): Promise<void> {
    await this.orderService.markOutForDelivery(order.orderId);
  }

  async markDelivered(order: KitchenOrder): Promise<void> {
    await this.orderService.markDelivered(order.orderId);
  }

  async cancelOrder(order: KitchenOrder): Promise<void> {
    if (confirm(`Are you sure you want to cancel Order #${order.orderId}?`)) {
      await this.orderService.cancelOrder(order.orderId);
    }
  }

  openReceipt(order: KitchenOrder): void {
    this.selectedReceiptOrder.set(order);
    this.isReceiptModalOpen.set(true);
  }

  closeReceipt(): void {
    this.isReceiptModalOpen.set(false);
    this.selectedReceiptOrder.set(null);
  }

  stopSiren(): void {
    this.orderService.stopAlarm();
    this.toastService.show('Siren silenced', 'info');
  }

  toggleSound(): void {
    this.orderService.toggleSound();
  }

  refreshOrders(): void {
    this.orderService.fetchOrders(false);
  }

  getRelativeTime(isoString: string): string {
    if (!isoString) return '';
    try {
      const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
      if (diff < 60) return 'Just now';
      if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
      if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
      return new Date(isoString).toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return '';
    }
  }

  getWhatsAppUrl(order: KitchenOrder): string {
    const msg = `Hello ${order.customerName}! Your order #${order.orderId} from The Bite Zone Bidar is being prepared. Thank you!`;
    return `https://wa.me/91${order.mobileNumber}?text=${encodeURIComponent(msg)}`;
  }

  /* ==========================================================================
     MENU & STOCK ACTIONS
     ========================================================================== */
  toggleDishStock(dish: MenuItem): void {
    const newStatus = this.menuService.toggleAvailability(dish.id);
    this.toastService.show(
      `"${dish.name}" is now ${newStatus ? 'IN STOCK ✅' : 'OUT OF STOCK ❌'}`,
      newStatus ? 'success' : 'warning'
    );
    this.adminService.syncToCloud();
  }

  updatePrice(dish: MenuItem, priceStr: string): void {
    const newPrice = parseInt(priceStr, 10);
    if (!isNaN(newPrice) && newPrice > 0 && newPrice !== dish.price) {
      this.menuService.updateItem(dish.id, { price: newPrice });
      this.toastService.show(`Price of ${dish.name} updated to ₹${newPrice}`, 'success');
      this.adminService.syncToCloud();
    }
  }

  openAddDishModal(): void {
    this.isNewDish.set(true);
    this.editingDish = this.getEmptyDish();
    this.isDishModalOpen.set(true);
  }

  openEditDishModal(dish: MenuItem): void {
    this.isNewDish.set(false);
    this.editingDish = { ...dish };
    this.isDishModalOpen.set(true);
  }

  saveDish(): void {
    if (!this.editingDish.name.trim()) {
      this.toastService.show('Please enter dish name', 'warning');
      return;
    }
    if (!this.editingDish.price || this.editingDish.price <= 0) {
      this.toastService.show('Please enter valid price', 'warning');
      return;
    }

    const placeholder = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80';
    const finalImage = this.editingDish.imageUrl?.trim() || placeholder;

    if (this.isNewDish()) {
      const newDish: MenuItem = {
        ...this.editingDish,
        id: 'tbzb_' + Date.now().toString(36),
        imageUrl: finalImage
      };
      this.menuService.addItem(newDish);
      this.toastService.show(`"${newDish.name}" added to menu!`, 'success');
    } else {
      const updatedDish: MenuItem = {
        ...this.editingDish,
        imageUrl: finalImage
      };
      this.menuService.updateItem(updatedDish.id, updatedDish);
      this.toastService.show(`"${updatedDish.name}" updated!`, 'success');
    }

    this.adminService.syncToCloud();
    this.isDishModalOpen.set(false);
  }

  deleteDish(dish: MenuItem): void {
    if (confirm(`Delete "${dish.name}" from menu?`)) {
      this.menuService.deleteItem(dish.id);
      this.toastService.show(`"${dish.name}" deleted`, 'info');
      this.adminService.syncToCloud();
    }
  }

  onImageFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.isProcessingImage = true;
    const reader = new FileReader();
    reader.onload = (e) => {
      this.editingDish.imageUrl = e.target?.result as string;
      this.isProcessingImage = false;
      this.toastService.show('Photo attached!', 'success');
    };
    reader.readAsDataURL(file);
  }

  /* ==========================================================================
     STORE STATUS ACTIONS
     ========================================================================== */
  setStoreMode(mode: 'auto' | 'open' | 'closed'): void {
    this.statusService.setKitchenOverride(mode);
    const msg = mode === 'open'
      ? 'Store forced OPEN! Customers can order now.'
      : mode === 'closed'
        ? 'Store forced CLOSED! Orders paused.'
        : 'Store returned to Auto Schedule (10:00 AM – 1:00 AM).';
    this.toastService.show(msg, mode === 'closed' ? 'warning' : 'success');
    this.adminService.syncToCloud();
  }

  /* ==========================================================================
     SECURITY & SETTINGS
     ========================================================================== */
  async onChangePin(): Promise<void> {
    if (!this.newPinInput || this.newPinInput.length < 6) {
      this.toastService.show('PIN must be at least 6 digits', 'warning');
      return;
    }
    if (this.newPinInput !== this.confirmPinInput) {
      this.toastService.show('PINs do not match', 'error');
      return;
    }
    const ok = await this.adminService.updatePin(this.newPinInput);
    if (ok) {
      this.newPinInput = '';
      this.confirmPinInput = '';
    }
  }

  private getEmptyDish(): MenuItem {
    return {
      id: '',
      name: '',
      price: null as unknown as number,
      category: 'non-veg',
      dietType: 'non-veg',
      description: '',
      imageUrl: '',
      isAvailable: true,
      featured: false,
      tags: []
    };
  }
}
