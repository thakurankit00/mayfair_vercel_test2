// Mock data for Mayfair Hotel Management System

// User roles
export const USER_ROLES = {
  CUSTOMER: 'customer',
  RECEPTIONIST: 'receptionist',
  WAITER: 'waiter',
  CHEF: 'chef',
  BARTENDER: 'bartender',
  MANAGER: 'manager',
  ADMIN: 'admin'
};

// Sample users
export const mockUsers = [
  {
    id: '1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.customer@example.com',
    phone: '+91-9876543210',
    role: USER_ROLES.CUSTOMER,
    isActive: true,
    profileImage: null,
    address: '123 Main St, Delhi',
    preferences: { roomType: 'deluxe', dietaryRestrictions: ['vegetarian'] }
  },
  {
    id: '2',
    firstName: 'Sarah',
    lastName: 'Wilson',
    email: 'sarah.receptionist@mayfairhotel.com',
    phone: '+91-9876543211',
    role: USER_ROLES.RECEPTIONIST,
    isActive: true,
    profileImage: null
  },
  {
    id: '3',
    firstName: 'Mike',
    lastName: 'Johnson',
    email: 'mike.manager@mayfairhotel.com',
    phone: '+91-9876543212',
    role: USER_ROLES.MANAGER,
    isActive: true,
    profileImage: null
  },
  {
    id: '4',
    firstName: 'Anna',
    lastName: 'Chef',
    email: 'anna.chef@mayfairhotel.com',
    phone: '+91-9876543213',
    role: USER_ROLES.CHEF,
    isActive: true,
    profileImage: null
  }
];

// Room types
export const mockRoomTypes = [
  {
    id: '1',
    name: 'Standard Room',
    description: 'Comfortable room with basic amenities',
    basePrice: 2000,
    maxOccupancy: 2,
    amenities: ['AC', 'TV', 'WiFi', 'Complimentary Breakfast'],
    images: ['/images/rooms/standard-1.jpg', '/images/rooms/standard-2.jpg'],
    isActive: true
  },
  {
    id: '2',
    name: 'Deluxe Room',
    description: 'Spacious room with mountain view and premium amenities',
    basePrice: 2500,
    maxOccupancy: 2,
    amenities: ['AC', 'TV', 'WiFi', 'Mini Bar', 'Mountain View', 'Room Service'],
    images: ['/images/rooms/deluxe-1.jpg', '/images/rooms/deluxe-2.jpg'],
    isActive: true
  },
  {
    id: '3',
    name: 'Premium Suite',
    description: 'Luxurious suite with living area and panoramic views',
    basePrice: 3500,
    maxOccupancy: 4,
    amenities: ['AC', 'TV', 'WiFi', 'Mini Bar', 'Living Area', 'Balcony', 'Premium Toiletries'],
    images: ['/images/rooms/suite-1.jpg', '/images/rooms/suite-2.jpg'],
    isActive: true
  },
  {
    id: '4',
    name: 'Family Room',
    description: 'Large room perfect for families with children',
    basePrice: 3000,
    maxOccupancy: 6,
    amenities: ['AC', 'TV', 'WiFi', 'Bunk Beds', 'Extra Bedding', 'Children Amenities'],
    images: ['/images/rooms/family-1.jpg', '/images/rooms/family-2.jpg'],
    isActive: true
  }
];

// Sample rooms
export const mockRooms = [
  { id: '1', roomNumber: '101', roomTypeId: '1', floor: 1, status: 'available' },
  { id: '2', roomNumber: '102', roomTypeId: '1', floor: 1, status: 'occupied' },
  { id: '3', roomNumber: '103', roomTypeId: '2', floor: 1, status: 'available' },
  { id: '4', roomNumber: '201', roomTypeId: '2', floor: 2, status: 'available' },
  { id: '5', roomNumber: '202', roomTypeId: '3', floor: 2, status: 'maintenance' },
  { id: '6', roomNumber: '301', roomTypeId: '4', floor: 3, status: 'available' }
];

// Sample bookings
export const mockBookings = [
  {
    id: '1',
    bookingReference: 'MH24001',
    userId: '1',
    roomId: '2',
    checkInDate: '2024-12-25',
    checkOutDate: '2024-12-27',
    adults: 2,
    children: 0,
    totalAmount: 5000,
    paidAmount: 5000,
    status: 'checked_in',
    specialRequests: 'Late check-in requested',
    createdAt: '2024-12-20T10:00:00Z'
  },
  {
    id: '2',
    bookingReference: 'MH24002',
    userId: '1',
    roomId: '4',
    checkInDate: '2024-12-28',
    checkOutDate: '2024-12-30',
    adults: 2,
    children: 1,
    totalAmount: 7500,
    paidAmount: 3750,
    status: 'confirmed',
    specialRequests: 'Extra bed for child',
    createdAt: '2024-12-21T14:30:00Z'
  }
];

// Restaurant tables
export const mockTables = [
  { id: '1', tableNumber: 'T1', capacity: 2, location: 'indoor', isActive: true },
  { id: '2', tableNumber: 'T2', capacity: 4, location: 'indoor', isActive: true },
  { id: '3', tableNumber: 'T3', capacity: 6, location: 'indoor', isActive: true },
  { id: '4', tableNumber: 'O1', capacity: 2, location: 'outdoor', isActive: true },
  { id: '5', tableNumber: 'O2', capacity: 4, location: 'outdoor', isActive: true },
  { id: '6', tableNumber: 'SB1', capacity: 4, location: 'sky_bar', isActive: true },
  { id: '7', tableNumber: 'SB2', capacity: 6, location: 'sky_bar', isActive: true }
];

// Menu categories
export const mockMenuCategories = [
  { id: '1', name: 'Appetizers', description: 'Delicious starters', type: 'restaurant', displayOrder: 1 },
  { id: '2', name: 'Main Course', description: 'Hearty main dishes', type: 'restaurant', displayOrder: 2 },
  { id: '3', name: 'Desserts', description: 'Sweet endings', type: 'restaurant', displayOrder: 3 },
  { id: '4', name: 'Cocktails', description: 'Signature cocktails', type: 'bar', displayOrder: 1 },
  { id: '5', name: 'Beverages', description: 'Non-alcoholic drinks', type: 'bar', displayOrder: 2 }
];

// Menu items
export const mockMenuItems = [
  {
    id: '1',
    categoryId: '1',
    name: 'Butter Chicken',
    description: 'Creamy tomato-based curry with tender chicken pieces',
    price: 450,
    image: '/images/menu/butter-chicken.jpg',
    ingredients: ['chicken', 'tomato', 'cream', 'spices'],
    allergens: ['dairy'],
    isVegetarian: false,
    isVegan: false,
    preparationTime: 25,
    calories: 520,
    isAvailable: true
  },
  {
    id: '2',
    categoryId: '1',
    name: 'Paneer Tikka',
    description: 'Grilled cottage cheese with Indian spices',
    price: 350,
    image: '/images/menu/paneer-tikka.jpg',
    ingredients: ['paneer', 'yogurt', 'spices'],
    allergens: ['dairy'],
    isVegetarian: true,
    isVegan: false,
    preparationTime: 20,
    calories: 300,
    isAvailable: true
  },
  {
    id: '3',
    categoryId: '2',
    name: 'Dal Makhani',
    description: 'Rich and creamy black lentil curry',
    price: 280,
    image: '/images/menu/dal-makhani.jpg',
    ingredients: ['black lentils', 'cream', 'butter', 'spices'],
    allergens: ['dairy'],
    isVegetarian: true,
    isVegan: false,
    preparationTime: 15,
    calories: 250,
    isAvailable: true
  },
  {
    id: '4',
    categoryId: '4',
    name: 'Himalayan Sunset',
    description: 'Signature cocktail with local herbs and fruits',
    price: 650,
    image: '/images/menu/himalayan-sunset.jpg',
    ingredients: ['vodka', 'local fruits', 'herbs'],
    allergens: [],
    isVegetarian: true,
    isVegan: true,
    preparationTime: 5,
    calories: 180,
    isAvailable: true
  },
  {
    id: '5',
    categoryId: '3',
    name: 'Gulab Jamun',
    description: 'Traditional Indian sweet dumplings in sugar syrup',
    price: 180,
    image: '/images/menu/gulab-jamun.jpg',
    ingredients: ['milk solids', 'sugar', 'cardamom'],
    allergens: ['dairy'],
    isVegetarian: true,
    isVegan: false,
    preparationTime: 10,
    calories: 200,
    isAvailable: true
  }
];

// Table reservations
export const mockReservations = [
  {
    id: '1',
    reservationReference: 'RT24001',
    userId: '1',
    tableId: '2',
    reservationDate: '2024-12-25',
    reservationTime: '19:30',
    partySize: 4,
    specialRequests: 'Birthday celebration',
    status: 'confirmed',
    createdAt: '2024-12-20T15:00:00Z'
  },
  {
    id: '2',
    reservationReference: 'RT24002',
    userId: '1',
    tableId: '6',
    reservationDate: '2024-12-26',
    reservationTime: '20:00',
    partySize: 2,
    specialRequests: 'Window seat preferred',
    status: 'confirmed',
    createdAt: '2024-12-21T12:00:00Z'
  }
];

// Sample orders
export const mockOrders = [
  {
    id: '1',
    orderNumber: 'ORD24001',
    userId: '1',
    tableId: '2',
    orderType: 'restaurant',
    items: [
      { menuItemId: '1', quantity: 2, unitPrice: 450, specialInstructions: 'Extra spicy' },
      { menuItemId: '3', quantity: 1, unitPrice: 280, specialInstructions: '' }
    ],
    totalAmount: 1180,
    status: 'preparing',
    placedAt: '2024-12-25T19:45:00Z'
  },
  {
    id: '2',
    orderNumber: 'ORD24002',
    userId: '1',
    tableId: '6',
    orderType: 'bar',
    items: [
      { menuItemId: '4', quantity: 2, unitPrice: 650, specialInstructions: 'Less ice' }
    ],
    totalAmount: 1300,
    status: 'ready',
    placedAt: '2024-12-25T20:15:00Z'
  }
];

// Sample offers
export const mockOffers = [
  {
    id: '1',
    title: 'Weekend Special',
    description: '25% off on weekend bookings',
    discountType: 'percentage',
    discountValue: 25,
    minAmount: 2000,
    applicableTo: 'rooms',
    validFrom: '2024-12-01',
    validUntil: '2024-12-31',
    usageLimit: 100,
    usedCount: 15,
    isActive: true
  },
  {
    id: '2',
    title: 'Family Feast',
    description: 'Free dessert for families with children',
    discountType: 'fixed',
    discountValue: 200,
    minAmount: 1000,
    applicableTo: 'restaurant',
    validFrom: '2024-12-15',
    validUntil: '2024-12-30',
    usageLimit: 50,
    usedCount: 8,
    isActive: true
  }
];

// Dashboard metrics
export const mockDashboardMetrics = {
  revenue: {
    today: 25000,
    thisWeek: 175000,
    thisMonth: 650000,
    growth: 12.5
  },
  bookings: {
    today: 5,
    thisWeek: 28,
    thisMonth: 120,
    occupancyRate: 78
  },
  orders: {
    today: 25,
    pending: 3,
    completed: 22,
    avgOrderValue: 850
  },
  customers: {
    total: 1250,
    newThisMonth: 85,
    returning: 65,
    satisfaction: 4.6
  }
};
