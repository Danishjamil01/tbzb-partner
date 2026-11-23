import { Injectable, signal, computed } from '@angular/core';
import { MENU_ITEMS } from '../data/menu.data';
import { MenuItem, FoodCategory, CategoryTab, DietType } from '../models/menu.model';

@Injectable({
  providedIn: 'root'
})
export class MenuService {
  // Centralized reactive menu items (loaded from LocalStorage if available, fallback to default MENU_ITEMS)
  private menuItemsSignal = signal<MenuItem[]>(this.loadInitialItems());

  // Active filters
  selectedCategory = signal<FoodCategory>('all');
  selectedDiet = signal<'all' | DietType>('all');
  searchQuery = signal<string>('');
  activeModalItem = signal<MenuItem | null>(null);
  isAllDishesPageOpen = signal<boolean>(false);

  // Category definitions with icons
  readonly categories: CategoryTab[] = [
    { id: 'all', label: 'All Items', icon: 'utensils' },
    { id: 'non-veg', label: 'Non-Veg', icon: 'drumstick' },
    { id: 'veg', label: 'Pure Veg', icon: 'leaf' },
    { id: 'south-indian', label: 'South Indian', icon: 'soup' },
    { id: 'sweets', label: 'Sweets', icon: 'cake' },
    { id: 'juices', label: 'Juices & Drinks', icon: 'glass-water' }
  ];

  readonly allItems = this.menuItemsSignal.asReadonly();

  // Featured items
  readonly featuredItems = computed(() => {
    return this.menuItemsSignal().filter(item => item.featured);
  });

  // Special product (Kunafa Jar)
  readonly kunafaProduct = computed(() => {
    return this.menuItemsSignal().find(item => item.specialProduct) ?? this.menuItemsSignal()[0];
  });

  // Filtered menu items based on current category, search, and diet
  readonly filteredItems = computed(() => {
    const items = this.menuItemsSignal();
    const cat = this.selectedCategory();
    const diet = this.selectedDiet();
    const query = this.searchQuery().trim().toLowerCase();

    return items.filter(item => {
      // Category match
      const categoryMatch = cat === 'all' || item.category === cat;

      // Diet match
      const dietMatch = diet === 'all' || item.dietType === diet;

      // Search query match
      const searchMatch = !query ||
        item.name.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        (item.tags && item.tags.some(t => t.toLowerCase().includes(query)));

      return categoryMatch && dietMatch && searchMatch;
    });
  });

  // Item counts by category
  readonly categoryCounts = computed(() => {
    const items = this.menuItemsSignal();
    const counts: Record<string, number> = {
      all: items.length,
      'non-veg': 0,
      veg: 0,
      'south-indian': 0,
      sweets: 0,
      juices: 0
    };

    items.forEach(item => {
      if (counts[item.category] !== undefined) {
        counts[item.category]++;
      }
    });

    return counts;
  });

  private loadInitialItems(): MenuItem[] {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = localStorage.getItem('tbzb_custom_menu');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      }
    } catch (e) {
      console.warn('Failed to read menu from localStorage', e);
    }
    return MENU_ITEMS;
  }

  private persistItems(items: MenuItem[]): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('tbzb_custom_menu', JSON.stringify(items));
      }
    } catch (e) {
      console.warn('Failed to persist menu to localStorage', e);
    }
  }

  /* ==========================================================================
     ADMIN CRUD ACTIONS (Real-time reactive updates across all components)
     ========================================================================== */
  updateItem(id: string, updates: Partial<MenuItem>): void {
    const updated = this.menuItemsSignal().map(item => {
      if (item.id === id) {
        return { ...item, ...updates };
      }
      return item;
    });
    this.menuItemsSignal.set(updated);
    this.persistItems(updated);
  }

  toggleAvailability(id: string): boolean {
    let newStatus = true;
    const updated = this.menuItemsSignal().map(item => {
      if (item.id === id) {
        newStatus = !item.isAvailable;
        return { ...item, isAvailable: newStatus };
      }
      return item;
    });
    this.menuItemsSignal.set(updated);
    this.persistItems(updated);
    return newStatus;
  }

  addItem(newItem: MenuItem): void {
    const updated = [newItem, ...this.menuItemsSignal()];
    this.menuItemsSignal.set(updated);
    this.persistItems(updated);
  }

  deleteItem(id: string): void {
    const updated = this.menuItemsSignal().filter(item => item.id !== id);
    this.menuItemsSignal.set(updated);
    this.persistItems(updated);
  }

  setAllItems(items: MenuItem[]): void {
    this.menuItemsSignal.set(items);
    this.persistItems(items);
  }

  resetToDefaultMenu(): void {
    this.menuItemsSignal.set(MENU_ITEMS);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem('tbzb_custom_menu');
      }
    } catch (e) {}
  }

  setCategory(category: FoodCategory): void {
    this.selectedCategory.set(category);
  }

  setDiet(diet: 'all' | DietType): void {
    this.selectedDiet.set(diet);
  }

  setSearchQuery(query: string): void {
    this.searchQuery.set(query);
  }

  openItemModal(item: MenuItem): void {
    this.activeModalItem.set(item);
  }

  openAllDishes(): void {
    this.isAllDishesPageOpen.set(true);
  }

  closeAllDishes(): void {
    this.isAllDishesPageOpen.set(false);
  }

  closeItemModal(): void {
    this.activeModalItem.set(null);
  }
}
