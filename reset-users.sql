-- Delete existing users and recreate them
-- Run this in Supabase SQL Editor if login is not working

-- Delete all existing users (this will cascade delete events and other related data)
DELETE FROM "User";

-- Insert fresh users with correct password hashes
INSERT INTO "User" (id, email, password, name, role, "createdAt", "updatedAt")
VALUES
  (gen_random_uuid()::text, 'admin@rolacards.com', '$2a$12$hpHdEHzRPzEqdmp/5vDR1e1I6E2ofF7FKjqt5gP42vV.xFF01Adie', 'Administrador', 'ADMIN', NOW(), NOW()),
  (gen_random_uuid()::text, 'staff@rolacards.com', '$2a$12$vYP/pTOLx.FA62C8M4CiFO9fg/hF6O9NALcssd/L5IzdMsa1BfBj.', 'Staff Member', 'STAFF', NOW(), NOW());

-- Verify users were created
SELECT id, email, name, role, "createdAt" FROM "User";

-- Show credentials
DO $$
BEGIN
  RAISE NOTICE '✅ Users recreated successfully!';
  RAISE NOTICE '📧 Admin: admin@rolacards.com / admin123';
  RAISE NOTICE '📧 Staff: staff@rolacards.com / staff123';
END $$;
