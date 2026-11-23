export type FoodCategory =
  | 'all'
  | 'non-veg'
  | 'veg'
  | 'south-indian'
  | 'sweets'
  | 'juices';

export type DietType = 'veg' | 'non-veg';

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: FoodCategory;
  dietType: DietType;
  description: string;
  imageUrl: string;
  featured?: boolean;
  specialProduct?: boolean; // Kunafa Jar
  tags?: string[];
  isAvailable: boolean;
}

export interface CategoryTab {
  id: FoodCategory;
  label: string;
  icon: string;
  count?: number;
}

