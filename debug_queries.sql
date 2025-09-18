-- 1. Check rooms table structure and data
SELECT 
  r.id,
  r.room_number,
  r.status,
  r.room_type_id,
  r.floor,
  r.max_occupancy,
  r.base_price
FROM rooms r
ORDER BY r.room_number;

-- 2. Check room_types table
SELECT 
  rt.id,
  rt.name,
  rt.description,
  rt.base_price,
  rt.max_occupancy
FROM room_types rt
ORDER BY rt.name;

-- 3. Check for rooms with missing room_type_id (NULL values)
SELECT 
  r.id,
  r.room_number,
  r.room_type_id
FROM rooms r
WHERE r.room_type_id IS NULL;

-- 4. Check JOIN between rooms and room_types
SELECT 
  r.id,
  r.room_number,
  r.status,
  rt.name as room_type_name,
  rt.base_price as type_base_price,
  r.base_price as room_base_price
FROM rooms r
LEFT JOIN room_types rt ON r.room_type_id = rt.id
ORDER BY r.room_number;

-- 5. Check for orphaned rooms (room_type_id doesn't exist in room_types)
SELECT 
  r.id,
  r.room_number,
  r.room_type_id
FROM rooms r
LEFT JOIN room_types rt ON r.room_type_id = rt.id
WHERE r.room_type_id IS NOT NULL AND rt.id IS NULL;

-- 6. Count total rooms and room types
SELECT 
  (SELECT COUNT(*) FROM rooms) as total_rooms,
  (SELECT COUNT(*) FROM room_types) as total_room_types,
  (SELECT COUNT(*) FROM rooms r JOIN room_types rt ON r.room_type_id = rt.id) as rooms_with_valid_types;