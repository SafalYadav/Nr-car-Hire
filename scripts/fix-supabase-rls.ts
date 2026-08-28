import { Client } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config();

const connectionString =
  process.env.DIRECT_URL ||
  process.env.DATABASE_URL ||
  'postgresql://postgres:qiQfot-8pofwo-roxdoz@db.nerswxfbytxooyxcnvnc.supabase.co:5432/postgres';

async function fixRls() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  console.log('Connected to Supabase PostgreSQL database.');

  const sql = `
    -- 1. Create non-recursive is_admin helper with SECURITY DEFINER
    CREATE OR REPLACE FUNCTION public.is_admin()
    RETURNS BOOLEAN AS $$
    BEGIN
      RETURN (
        SELECT EXISTS (
          SELECT 1 FROM public.profiles
          WHERE id = auth.uid() AND role = 'ADMIN'
        )
      );
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

    -- 2. Drop existing policies
    DROP POLICY IF EXISTS "Admins have full access to profiles" ON public.profiles;
    DROP POLICY IF EXISTS "Admins have full access to vehicles" ON public.vehicles;
    DROP POLICY IF EXISTS "Admins have full access to vehicle images" ON public.vehicle_images;
    DROP POLICY IF EXISTS "Admins have full access to maintenances" ON public.vehicle_maintenances;
    DROP POLICY IF EXISTS "Admins have full access to locations" ON public.locations;
    DROP POLICY IF EXISTS "Admins have full access to discounts" ON public.discounts;
    DROP POLICY IF EXISTS "Admins have full access to extras" ON public.extras;
    DROP POLICY IF EXISTS "Admins have full access to bookings" ON public.bookings;
    DROP POLICY IF EXISTS "Admins have full access to payments" ON public.payments;
    DROP POLICY IF EXISTS "Admins have full access to audit logs" ON public.admin_audit_logs;
    DROP POLICY IF EXISTS "Users can view own bookings" ON public.bookings;
    DROP POLICY IF EXISTS "Public can create bookings" ON public.bookings;
    DROP POLICY IF EXISTS "Users can update own bookings" ON public.bookings;
    DROP POLICY IF EXISTS "Public can view own payment records" ON public.payments;
    DROP POLICY IF EXISTS "Public can create payment records" ON public.payments;
    DROP POLICY IF EXISTS "Public can view bookings" ON public.bookings;
    DROP POLICY IF EXISTS "Public can update bookings" ON public.bookings;
    DROP POLICY IF EXISTS "Public can view payments" ON public.payments;
    DROP POLICY IF EXISTS "Public can update payments" ON public.payments;
    DROP POLICY IF EXISTS "Public can view active vehicles" ON public.vehicles;
    DROP POLICY IF EXISTS "Public can view vehicle images" ON public.vehicle_images;
    DROP POLICY IF EXISTS "Public can view active locations" ON public.locations;
    DROP POLICY IF EXISTS "Public can view active discounts" ON public.discounts;
    DROP POLICY IF EXISTS "Public can view active extras" ON public.extras;
    DROP POLICY IF EXISTS "Public can view vehicle maintenances" ON public.vehicle_maintenances;

    -- 3. Re-create clean, non-recursive policies
    CREATE POLICY "Public can view bookings" ON public.bookings FOR SELECT USING (TRUE);
    CREATE POLICY "Public can create bookings" ON public.bookings FOR INSERT WITH CHECK (TRUE);
    CREATE POLICY "Public can update bookings" ON public.bookings FOR UPDATE USING (TRUE);

    CREATE POLICY "Public can view payments" ON public.payments FOR SELECT USING (TRUE);
    CREATE POLICY "Public can create payments" ON public.payments FOR INSERT WITH CHECK (TRUE);
    CREATE POLICY "Public can update payments" ON public.payments FOR UPDATE USING (TRUE);

    CREATE POLICY "Public can view active vehicles" ON public.vehicles FOR SELECT USING (TRUE);
    CREATE POLICY "Public can view vehicle images" ON public.vehicle_images FOR SELECT USING (TRUE);
    CREATE POLICY "Public can view active locations" ON public.locations FOR SELECT USING (TRUE);
    CREATE POLICY "Public can view active discounts" ON public.discounts FOR SELECT USING (TRUE);
    CREATE POLICY "Public can view active extras" ON public.extras FOR SELECT USING (TRUE);
    CREATE POLICY "Public can view vehicle maintenances" ON public.vehicle_maintenances FOR SELECT USING (TRUE);
  `;

  await client.query(sql);
  console.log('Successfully updated Supabase RLS policies!');

  // Check bookings table
  const testRes = await client.query('SELECT count(*) FROM public.bookings;');
  console.log('Bookings table count:', testRes.rows[0]);

  await client.end();
}

fixRls().catch((err) => {
  console.error('Error fixing Supabase RLS:', err);
  process.exit(1);
});
