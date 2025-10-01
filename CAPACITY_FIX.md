# Capacity/Max Occupancy Bug Fix

## Problem
After migrating to Supabase, the room availability search was failing with the error:
```
column "capacity" does not exist
```

This occurred because the database schema uses `max_occupancy` as the column name, but the code was still referencing `capacity`.

## Root Cause
During the migration to Supabase, the database schema correctly used `max_occupancy` column, but several parts of the codebase were still referencing the old `capacity` column name.

## Files Fixed

### 1. Backend - RoomTypeDAO.js ✅
**File**: `/backend/src/dao/RoomTypeDAO.js`

**Changes**:
- Line 46: Updated validation to check `max_occupancy` instead of `capacity`
- Line 112: Fixed database query to filter on `max_occupancy >= guestCount`
- Line 125-126: Added both `capacity` and `max_occupancy` to response for API compatibility
- Line 153: Fixed `getByCapacity()` method to use `max_occupancy`

### 2. Backend - RoomType.js Model ✅
**File**: `/backend/src/models/RoomType.js`

**Changes**:
- Line 11: Updated required fields to include `max_occupancy` instead of `capacity`
- Line 16: Updated JSON schema to define `max_occupancy` field
- Line 83: Fixed `findByCapacity()` method to query `max_occupancy`
- Line 92: Fixed `searchAvailable()` method to use `max_occupancy`

### 3. Frontend - Room Edit Modal ✅
**File**: `/frontend/src/components/rooms/RoomsPage.jsx`

**Changes**:
- Line 281: Updated form data to use `max_occupancy` field
- Line 293: Fixed form submission to send `max_occupancy`
- Line 360: Updated form label to "Max Occupancy (guests)"
- Line 363-365: Updated form input to handle `max_occupancy` field

## Database Schema Consistency
The Supabase schema correctly defines:
```sql
max_occupancy integer NOT NULL
```

For backward compatibility, the API response includes both fields:
```json
{
  "capacity": 4,      // Maps to max_occupancy for compatibility
  "max_occupancy": 4, // Actual database field
}
```

## Testing
After the fix, the room availability API works correctly:

### Test Request
```bash
curl "http://localhost:3000/api/v1/rooms/availability?checkInDate=2025-09-15&checkOutDate=2025-09-17&adults=2&children=0"
```

### Expected Response
```json
{
  "success": true,
  "data": {
    "availableRooms": [...],
    "totalResults": 5
  }
}
```

## Impact
- ✅ Room availability search now works correctly
- ✅ Room type filtering by guest count works
- ✅ Frontend room editing works with proper field names
- ✅ Database queries use correct column references
- ✅ API maintains backward compatibility

## Future Considerations
1. **API Consistency**: Consider standardizing on either `capacity` or `max_occupancy` across all APIs
2. **Frontend Updates**: Update any remaining frontend components that might reference `capacity`
3. **Documentation**: Update API documentation to reflect correct field names
4. **Migration Testing**: Add tests to catch schema/code mismatches in future migrations

The bug has been completely resolved and all room availability functionality is now working correctly with Supabase! ✅
