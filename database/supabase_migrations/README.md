# Supabase Payment System Migration

## Overview
This migration adds comprehensive payment functionality to the Mayfair Hotel Management System, including:

- **New Order Statuses**: `billed`, `payment_pending`, `paid`, `completed`
- **Payment Tables**: `payments`, `payment_logs`, `bills`
- **PayU Integration**: Complete payment gateway support
- **Automatic Status Management**: Triggers and functions for order workflow
- **Bill Generation**: Automated bill numbering and tracking

## How to Apply Migration

### Option 1: Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `20250914_add_payment_system.sql`
4. Click **Run** to execute the migration

### Option 2: Supabase CLI
```bash
# If you have Supabase CLI installed
supabase db reset --linked
# Then apply the migration file
```

### Option 3: Direct Database Connection
```bash
# Using psql with your Supabase connection string
psql "postgresql://postgres.aglpkgpajcgjdlfunwyr:Aadya@2025@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres" -f 20250914_add_payment_system.sql
```

## New Database Schema

### Orders Table (Enhanced)
- Added payment-related columns:
  - `billed_at`: When bill was generated
  - `payment_requested_at`: When payment was requested
  - `payment_completed_at`: When payment was completed
  - `completed_at`: When order was fully completed
  - `bill_number`: Generated bill reference
  - `payment_method`: Method used for payment
  - `payment_reference`: Gateway transaction reference

### Payments Table (New)
- `id`: Primary key
- `order_id`: Reference to order
- `payment_intent_id`: Unique payment identifier
- `amount`: Payment amount
- `status`: Payment status (pending, processing, completed, failed, cancelled)
- `gateway`: Payment gateway (payu, razorpay, etc.)
- `customer_*`: Customer information
- `gateway_response`: Raw gateway response data

### Bills Table (New)
- `id`: Primary key
- `order_id`: Reference to order
- `bill_number`: Auto-generated bill number (BILL20250914XXXX)
- `subtotal`, `tax_amount`, `service_charge`, `discount`: Bill breakdown
- `total_amount`: Final amount
- `generated_by`: User who generated the bill

### Payment Logs Table (New)
- Audit trail for all payment events
- Stores gateway responses and system events

## Order Status Workflow

```
pending → preparing → ready → served → billed → payment_pending → paid → completed
                                ↓         ↓           ↓           ↓
                            cancelled  cancelled   cancelled   cancelled
```

## Environment Variables Required

Add these to your `.env` file:

```env
# PayU Payment Gateway
PAYU_ENABLED=true
PAYU_MERCHANT_ID=your_payu_merchant_id
PAYU_SECRET_KEY=your_payu_secret_key
PAYU_SALT=your_payu_salt
PAYU_BASE_URL=https://test.payu.in/_payment
PAYU_SUCCESS_URL=http://localhost:3000/api/v1/payments/callback/success
PAYU_FAILURE_URL=http://localhost:3000/api/v1/payments/callback/failure
```

## Row Level Security (RLS)

After running the migration, you may need to set up RLS policies in Supabase:

1. Go to **Authentication** → **Policies**
2. Create policies for the new tables based on your security requirements

Example policies:
```sql
-- Allow authenticated users to view their own payments
CREATE POLICY "Users can view own payments" ON payments
FOR SELECT USING (auth.uid() IN (
  SELECT user_id FROM orders WHERE id = order_id
));

-- Allow waiters to create bills
CREATE POLICY "Waiters can create bills" ON bills
FOR INSERT WITH CHECK (
  auth.jwt() ->> 'role' IN ('waiter', 'manager', 'admin')
);
```

## Testing the Migration

After applying the migration, test with:

```sql
-- Check new order statuses are available
SELECT unnest(enum_range(NULL::order_status));

-- Verify tables were created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('payments', 'payment_logs', 'bills');

-- Test bill number generation
SELECT generate_bill_number();
```

## Rollback (if needed)

If you need to rollback this migration:

```sql
-- Drop new tables
DROP TABLE IF EXISTS payment_logs CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS bills CASCADE;

-- Remove new columns from orders
ALTER TABLE orders 
DROP COLUMN IF EXISTS billed_at,
DROP COLUMN IF EXISTS payment_requested_at,
DROP COLUMN IF EXISTS payment_completed_at,
DROP COLUMN IF EXISTS completed_at,
DROP COLUMN IF EXISTS bill_number,
DROP COLUMN IF EXISTS payment_method,
DROP COLUMN IF EXISTS payment_reference;

-- Note: Cannot easily remove enum values in PostgreSQL
-- You would need to recreate the enum type
```

## Support

If you encounter any issues:
1. Check the Supabase logs in your dashboard
2. Verify all environment variables are set
3. Ensure your database user has sufficient permissions
4. Check that the migration completed without errors
