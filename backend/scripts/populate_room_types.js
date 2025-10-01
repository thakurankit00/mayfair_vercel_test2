const db = require('../src/config/database');
const { v4: uuidv4 } = require('uuid');

async function populateRoomTypes() {
  try {
    console.log('🔄 Populating room types...');

    // Clear existing room types
    console.log('Clearing existing room types...');
    await db('room_types').del();

    // Create room types
    console.log('Creating room types...');
    const roomTypes = [
      {
        name: 'Standard Room',
        description: 'Comfortable room with essential amenities',
        base_price: 2000.00,
        max_occupancy: 2,
        amenities: JSON.stringify(['AC', 'TV', 'WiFi', 'Private Bathroom']),
        images: JSON.stringify(['standard1.jpg', 'standard2.jpg']),
        is_active: true
      },
      {
        name: 'Deluxe Room',
        description: 'Spacious room with mountain view and premium amenities',
        base_price: 3500.00,
        max_occupancy: 3,
        amenities: JSON.stringify(['AC', 'LED TV', 'WiFi', 'Mini Bar', 'Room Service', 'Mountain View']),
        images: JSON.stringify(['deluxe1.jpg', 'deluxe2.jpg', 'deluxe3.jpg']),
        is_active: true
      },
      {
        name: 'Suite',
        description: 'Luxurious suite with separate living area and premium facilities',
        base_price: 5500.00,
        max_occupancy: 4,
        amenities: JSON.stringify(['AC', 'LED TV', 'WiFi', 'Mini Bar', 'Room Service', 'Valley View', 'Separate Living Area', 'Balcony']),
        images: JSON.stringify(['suite1.jpg', 'suite2.jpg', 'suite3.jpg', 'suite4.jpg']),
        is_active: true
      },
      {
        name: 'Premium Suite',
        description: 'Ultimate luxury experience with panoramic views and exclusive amenities',
        base_price: 8000.00,
        max_occupancy: 6,
        amenities: JSON.stringify(['AC', 'Smart TV', 'High-speed WiFi', 'Fully Stocked Mini Bar', '24/7 Room Service', 'Panoramic View', 'Separate Living & Dining Area', 'Private Balcony', 'Jacuzzi', 'Butler Service']),
        images: JSON.stringify(['premium1.jpg', 'premium2.jpg', 'premium3.jpg', 'premium4.jpg', 'premium5.jpg']),
        is_active: true
      },
      {
        name: 'Family Room',
        description: 'Spacious room perfect for families with connecting beds',
        base_price: 4200.00,
        max_occupancy: 6,
        amenities: JSON.stringify(['AC', 'TV', 'WiFi', 'Mini Fridge', 'Extra Beds', 'Family Entertainment', 'Safe']),
        images: JSON.stringify(['family1.jpg', 'family2.jpg']),
        is_active: true
      }
    ];

    const roomTypeData = roomTypes.map(roomType => ({
      id: uuidv4(),
      ...roomType,
      created_at: new Date(),
      updated_at: new Date()
    }));

    await db('room_types').insert(roomTypeData);
    console.log(`✅ Created ${roomTypes.length} room types`);

    console.log('\n🎉 Room types populated successfully!');
    console.log('\n📊 Summary:');
    roomTypes.forEach((type, index) => {
      console.log(`   • ${type.name}: ₹${type.base_price}/night (${type.max_occupancy} guests)`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error populating room types:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  populateRoomTypes();
}

module.exports = populateRoomTypes;
