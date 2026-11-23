import { MenuItem } from '../models/menu.model';

export const MENU_ITEMS: MenuItem[] = [
  // ==========================================
  // SPECIAL PRODUCT: KUNAFA JAR
  // ==========================================
  {
    id: 'kunafa-jar',
    name: 'Kunafa Jar',
    price: 250,
    category: 'sweets',
    dietType: 'veg',
    description: 'Crispy golden spun pastry layered with velvety cream and sweet aromatic syrup, crafted into a signature dessert jar.',
    imageUrl: 'images/food/kunafa-showcase1.png',
    featured: true,
    specialProduct: true,
    tags: ['Signature Dessert', 'Bestseller', 'Chef Special'],
    isAvailable: true
  },

  // ==========================================
  // CATEGORY: NON-VEG
  // ==========================================
  {
    id: 'chicken-cheese-egg-roll',
    name: 'Chicken Cheese Egg Roll',
    price: 120,
    category: 'non-veg',
    dietType: 'non-veg',
    description: 'Juicy spiced chicken kebab pieces rolled in flaky paratha with melted cheese and fresh egg.',
    imageUrl: 'images/food/chicken-cheese-egg-roll.png',
    featured: true,
    tags: ['Popular', 'Chef Special'],
    isAvailable: true
  },
  {
    id: 'cheese-egg-roll',
    name: 'Cheese Egg Roll',
    price: 110,
    category: 'non-veg',
    dietType: 'non-veg',
    description: 'Crisp layered paratha loaded with beaten spiced egg, sliced onions, and rich cheese.',
    imageUrl: 'images/food/cheese-egg-roll.jpg',
    featured: false,
    tags: ['Snacks'],
    isAvailable: true
  },
  {
    id: 'egg-roll',
    name: 'Egg Roll',
    price: 90,
    category: 'non-veg',
    dietType: 'non-veg',
    description: 'Classic street style egg roll with seasoned onions, green chilies, and house spices.',
    imageUrl: 'images/food/egg-roll.jpg',
    featured: false,
    tags: ['Classic'],
    isAvailable: true
  },
  {
    id: 'chicken-soup',
    name: 'Chicken Soup',
    price: 120,
    category: 'non-veg',
    dietType: 'non-veg',
    description: 'Slow-simmered, aromatic chicken broth infused with cracked black pepper, garlic, and herbs.',
    imageUrl: 'images/food/chicken-soup.jpg',
    featured: false,
    tags: ['Comfort Food'],
    isAvailable: true
  },
  {
    id: 'garlic-chicken-cheese-legpiece',
    name: 'Garlic Chicken Cheese Legpiece',
    price: 120,
    category: 'non-veg',
    dietType: 'non-veg',
    description: 'Tender chicken drumstick infused with roasted garlic paste and finished with melted cheese coating.',
    imageUrl: 'images/food/garlic-chicken-cheese-legpiece.jpg',
    featured: false,
    tags: ['Starters'],
    isAvailable: true
  },
  {
    id: 'chicken-crunchy-golden-fry',
    name: 'Chicken Crunchy Golden Fry',
    price: 210,
    category: 'non-veg',
    dietType: 'non-veg',
    description: 'Deep-fried golden chicken bites seasoned in TBZB secret spice rub with an ultra-crispy crust.',
    imageUrl: 'images/food/chicken-crunchy-golden-fry.jpg',
    featured: true,
    tags: ['Crispy', 'Bestseller'],
    isAvailable: true
  },
  {
    id: 'mutton-pulav',
    name: 'Mutton Pulav',
    price: 250,
    category: 'non-veg',
    dietType: 'non-veg',
    description: 'Fragrant basmati rice gently cooked with tender bone-in mutton pieces, whole garam masala, and saffron.',
    imageUrl: 'images/food/mutton-pulav.jpg',
    featured: false,
    tags: ['Royal Fare'],
    isAvailable: true
  },
  {
    id: 'chicken-65',
    name: 'Chicken 65',
    price: 250,
    category: 'non-veg',
    dietType: 'non-veg',
    description: 'Spicy, deep-red tender chicken chunks tempered with fresh curry leaves, mustard seeds, and curd.',
    imageUrl: 'images/food/chicken-65.jpg',
    featured: false,
    tags: ['Spicy', 'House Special'],
    isAvailable: true
  },
  {
    id: 'chicken-handi-biryani',
    name: 'Chicken Handi Biryani',
    price: 220,
    category: 'non-veg',
    dietType: 'non-veg',
    description: 'Traditional slow dum-cooked handi biryani packed with marinated chicken, caramelized onions, and fragrant spices.',
    imageUrl: 'images/food/chicken-handi-biryani.jpg',
    featured: true,
    tags: ['Signature Dum', 'Top Rated'],
    isAvailable: true
  },
  {
    id: 'chicken-majestic',
    name: 'Chicken Majestic',
    price: 289,
    category: 'non-veg',
    dietType: 'non-veg',
    description: 'Stir-fried boneless chicken strips coated in spiced yogurt marinade with mint, green chillies, and garlic.',
    imageUrl: 'images/food/chicken-majestic.jpg',
    featured: false,
    tags: ['Hyderabadi Style'],
    isAvailable: true
  },
  {
    id: 'chicken-cheese-sandwich',
    name: 'Chicken Cheese Sandwich',
    price: 150,
    category: 'non-veg',
    dietType: 'non-veg',
    description: 'Toasted buttered bread packed with shredded chicken tikka, rich cheddar-mozzarella blend, and herb mayo.',
    imageUrl: 'images/food/chicken-cheese-sandwich.jpg',
    featured: false,
    tags: ['Quick Bite'],
    isAvailable: true
  },
  {
    id: 'egg-bread',
    name: 'Egg Bread',
    price: 89,
    category: 'non-veg',
    dietType: 'non-veg',
    description: 'Thick bread slices dipped in a spiced masala egg batter and griddled with butter until crisp and fluffy.',
    imageUrl: 'images/food/egg-bread.jpg',
    featured: false,
    tags: ['Breakfast & Evening'],
    isAvailable: true
  },
  {
    id: 'korean-noodles',
    name: 'Korean Noodles (Veg / Non-Veg)',
    price: 169,
    category: 'non-veg',
    dietType: 'non-veg',
    description: 'Fiery wok-tossed ramen noodles infused with Korean chili sauce, garlic, sesame oil, and crunchy greens.',
    imageUrl: 'images/food/korean-noodles.jpg',
    featured: false,
    tags: ['Spicy', 'Trending'],
    isAvailable: true
  },

  // ==========================================
  // CATEGORY: VEG
  // ==========================================
  {
    id: 'tomato-soup',
    name: 'Tomato Soup',
    price: 85,
    category: 'veg',
    dietType: 'veg',
    description: 'Rich and velvety roasted tomato soup served hot with toasted bread croutons and fresh cream swirl.',
    imageUrl: 'images/food/tomato-soup.jpg',
    featured: false,
    tags: ['Warm & Comforting'],
    isAvailable: true
  },
  {
    id: 'veg-manchurian',
    name: 'Veg Manchurian',
    price: 140,
    category: 'veg',
    dietType: 'veg',
    description: 'Crisp vegetable dumplings simmered in a dark, spicy Indo-Chinese ginger-garlic and soy gravy.',
    imageUrl: 'images/food/veg-manchurian.jpg',
    featured: false,
    tags: ['Indo-Chinese'],
    isAvailable: true
  },
  {
    id: 'schezwan-maggi',
    name: 'Schezwan Maggi',
    price: 75,
    category: 'veg',
    dietType: 'veg',
    description: 'Maggi noodles tossed with zesty Schezwan paste, spring onions, and finely chopped bell peppers.',
    imageUrl: 'images/food/schezwan-maggi.jpg',
    featured: false,
    tags: ['Maggi Lovers', 'Spicy'],
    isAvailable: true
  },
  {
    id: 'cheese-corn-maggi',
    name: 'Cheese Corn Maggi',
    price: 89,
    category: 'veg',
    dietType: 'veg',
    description: 'Creamy Maggi loaded with sweet tender corn kernels and a generous blanket of molten cheese.',
    imageUrl: 'images/food/cheese-corn-maggi.jpg',
    featured: false,
    tags: ['Kids Favourite'],
    isAvailable: true
  },
  {
    id: 'cheese-maggi',
    name: 'Cheese Maggi',
    price: 78,
    category: 'veg',
    dietType: 'veg',
    description: 'The ultimate midnight comfort food: hot noodles layered with bubbling melted cheese.',
    imageUrl: 'images/food/cheese-maggi.jpg',
    featured: false,
    tags: ['Cheesy'],
    isAvailable: true
  },
  {
    id: 'normal-maggi',
    name: 'Normal Maggi',
    price: 65,
    category: 'veg',
    dietType: 'veg',
    description: 'Classic 2-minute nostalgia cooked just right with authentic tastemaker spices.',
    imageUrl: 'images/food/normal-maggi.jpg',
    featured: false,
    tags: ['Classic'],
    isAvailable: true
  },
  {
    id: 'masala-maggi',
    name: 'Masala Maggi',
    price: 75,
    category: 'veg',
    dietType: 'veg',
    description: 'Cooked with diced tomatoes, onions, green peas, and extra roasted spice blend.',
    imageUrl: 'images/food/masala-maggi.jpg',
    featured: false,
    tags: ['Desi Style'],
    isAvailable: true
  },
  {
    id: 'peri-peri-french-fries',
    name: 'Peri Peri French Fries',
    price: 120,
    category: 'veg',
    dietType: 'veg',
    description: 'Golden crispy potato fries tossed in a spicy, tangy African bird’s eye peri peri seasoning.',
    imageUrl: 'images/food/peri-peri-french-fries.jpg',
    featured: false,
    tags: ['Crispy Snack', 'Top Seller'],
    isAvailable: true
  },
  {
    id: 'fried-veg-momos',
    name: 'Fried Veg Momos',
    price: 150,
    category: 'veg',
    dietType: 'veg',
    description: 'Golden-fried momo dumplings stuffed with finely minced seasoned vegetables, served with red chutney.',
    imageUrl: 'images/food/fried-veg-momos.jpg',
    featured: false,
    tags: ['Crunchy Delight'],
    isAvailable: true
  },
  {
    id: 'aalu-paratha',
    name: 'Aalu Paratha',
    price: 69,
    category: 'veg',
    dietType: 'veg',
    description: 'Whole wheat flatbread stuffed with spiced mashed potatoes, fresh coriander, and served hot with butter.',
    imageUrl: 'images/food/aalu-paratha.jpg',
    featured: false,
    tags: ['Hearty'],
    isAvailable: true
  },
  {
    id: 'steam-veg-momos',
    name: 'Steam Veg Momos',
    price: 100,
    category: 'veg',
    dietType: 'veg',
    description: 'Delicate steamed dumplings stuffed with crunchy cabbage, carrots, and spring onions with fiery dip.',
    imageUrl: 'images/food/steam-veg-momos.jpg',
    featured: false,
    tags: ['Healthy Choice'],
    isAvailable: true
  },
  {
    id: 'veg-sandwich',
    name: 'Veg Sandwich',
    price: 80,
    category: 'veg',
    dietType: 'veg',
    description: 'Fresh grilled sandwich filled with crisp cucumbers, ripe tomatoes, onions, mint chutney, and butter.',
    imageUrl: 'images/food/veg-sandwich.jpg',
    featured: false,
    tags: ['Fresh Bite'],
    isAvailable: true
  },

  // ==========================================
  // CATEGORY: SOUTH INDIAN
  // ==========================================
  {
    id: 'special-dosa',
    name: 'Special Dosa',
    price: 149,
    category: 'south-indian',
    dietType: 'veg',
    description: 'Chef signature crisp fermented crepe layered with rich spiced potato masala, paneer, and aromatic podi.',
    imageUrl: 'images/food/special-dosa.jpg',
    featured: false,
    tags: ['TBZB Special'],
    isAvailable: true
  },
  {
    id: 'masala-dosa',
    name: 'Masala Dosa',
    price: 49,
    category: 'south-indian',
    dietType: 'veg',
    description: 'Crispy rice and lentil crepe smeared with spicy red chutney and stuffed with spiced potato bhaji.',
    imageUrl: 'images/food/masala-dosa.jpg',
    featured: false,
    tags: ['Traditional Favorite'],
    isAvailable: true
  },
  {
    id: 'butter-dosa',
    name: 'Butter Dosa',
    price: 79,
    category: 'south-indian',
    dietType: 'veg',
    description: 'Golden dosa roasted to perfection with generous dollops of fresh butter, served with coconut chutney & sambar.',
    imageUrl: 'images/food/butter-dosa.jpg',
    featured: false,
    tags: ['Rich & Crispy'],
    isAvailable: true
  },
  {
    id: 'plain-dosa',
    name: 'Plain Dosa',
    price: 30,
    category: 'south-indian',
    dietType: 'veg',
    description: 'Simple, paper-thin crispy fermented crepe served piping hot with flavorful coconut chutney and lentil sambar.',
    imageUrl: 'images/food/plain-dosa.jpg',
    featured: false,
    tags: ['Budget Friendly'],
    isAvailable: true
  },

  // ==========================================
  // CATEGORY: SWEETS
  // ==========================================
  {
    id: 'dry-gulab-jamun',
    name: 'Dry Gulab Jamun (2 Pieces)',
    price: 70,
    category: 'sweets',
    dietType: 'veg',
    description: 'Soft melt-in-mouth milk-solid dumplings gently soaked in cardamom syrup and rolled in desiccated coconut.',
    imageUrl: 'images/food/dry-gulab-jamun.jpg',
    featured: false,
    tags: ['Mithai'],
    isAvailable: true
  },
  {
    id: 'fruit-custard',
    name: 'Fruit Custard',
    price: 149,
    category: 'sweets',
    dietType: 'veg',
    description: 'Chilled creamy vanilla custard loaded with freshly diced seasonal fruits, pomegranate pearls, and grapes.',
    imageUrl: 'images/food/fruit-custard.jpg',
    featured: false,
    tags: ['Cool Dessert'],
    isAvailable: true
  },
  {
    id: 'chocolate-pan',
    name: 'Chocolate Pan',
    price: 50,
    category: 'sweets',
    dietType: 'veg',
    description: 'Refreshing betel leaf filled with sweet gulkand, tutty-fruity, and coated in rich dark chocolate shell.',
    imageUrl: 'images/food/chocolate-pan.jpg',
    featured: false,
    tags: ['After Meal Delicacy'],
    isAvailable: true
  },
  {
    id: 'gajar-ka-halva',
    name: 'Gajar Ka Halva',
    price: 90,
    category: 'sweets',
    dietType: 'veg',
    description: 'Slow-cooked grated tender carrots in pure desi ghee, whole milk, khoya, roasted cashews, and almonds.',
    imageUrl: 'images/food/gajar-ka-halva.jpg',
    featured: false,
    tags: ['Desi Ghee Sweet'],
    isAvailable: true
  },

  // ==========================================
  // CATEGORY: JUICES & DRINKS
  // ==========================================
  {
    id: 'papaya-juice',
    name: 'Papaya Juice',
    price: 119,
    category: 'juices',
    dietType: 'veg',
    description: 'Freshly pressed sun-ripened papaya with a squeeze of lime, rich in natural vitamins and refreshing antioxidants.',
    imageUrl: 'images/food/papaya-juice.jpg',
    featured: false,
    tags: ['Fresh Juice'],
    isAvailable: true
  },
  {
    id: 'orange-juice',
    name: 'Orange Juice',
    price: 95,
    category: 'juices',
    dietType: 'veg',
    description: 'Pure freshly squeezed citrus oranges chilled and served naturally sweet without artificial flavors.',
    imageUrl: 'images/food/orange-juice.jpg',
    featured: false,
    tags: ['Vitamin C'],
    isAvailable: true
  },
  {
    id: 'pineapple-juice',
    name: 'Pineapple Juice',
    price: 115,
    category: 'juices',
    dietType: 'veg',
    description: 'Tangy and tropical fresh pineapple blend served chilled with a hint of rock salt and mint.',
    imageUrl: 'images/food/pineapple-juice.jpg',
    featured: false,
    tags: ['Tropical'],
    isAvailable: true
  },
  {
    id: 'avocado-shake',
    name: 'Avocado Shake',
    price: 149,
    category: 'juices',
    dietType: 'veg',
    description: 'Velvety smooth butter fruit shake blended with chilled milk, honey, and a touch of condensed milk.',
    imageUrl: 'images/food/avocado-shake.jpg',
    featured: false,
    tags: ['Superfood', 'Creamy'],
    isAvailable: true
  },
  {
    id: 'banana-shake',
    name: 'Banana Shake',
    price: 59,
    category: 'juices',
    dietType: 'veg',
    description: 'Healthy ripe bananas whipped with cold fresh milk, cardamom powder, and crushed dry fruits.',
    imageUrl: 'images/food/banana-shake.jpg',
    featured: false,
    tags: ['Energy Booster'],
    isAvailable: true
  },
  {
    id: 'cold-coffee',
    name: 'Cold Coffee',
    price: 49,
    category: 'juices',
    dietType: 'veg',
    description: 'Frothy and bold brewed coffee blended with ice-cold milk, chocolate syrup drizzle, and cream.',
    imageUrl: 'images/food/cold-coffee.jpg',
    featured: false,
    tags: ['Cafe Style'],
    isAvailable: true
  },
  {
    id: 'falooda',
    name: 'Falooda',
    price: 129,
    category: 'juices',
    dietType: 'veg',
    description: 'Royal dessert beverage with sweet rose syrup, vermicelli, sabja basil seeds, rich milk, and kulfi cream.',
    imageUrl: 'images/food/falooda.jpg',
    featured: false,
    tags: ['Royal Treat'],
    isAvailable: true
  },
  {
    id: 'dry-fruit-shake',
    name: 'Dry Fruit Shake',
    price: 149,
    category: 'juices',
    dietType: 'veg',
    description: 'Power-packed rich shake blended with premium almonds, cashews, pistachios, dates, and saffron milk.',
    imageUrl: 'images/food/dry-fruit-shake.jpg',
    featured: false,
    tags: ['Premium Nutrition'],
    isAvailable: true
  }
];

