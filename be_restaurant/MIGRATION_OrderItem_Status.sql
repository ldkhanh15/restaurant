-- Migration script to update OrderItem status enum
-- This adds 'preparing', 'ready', and 'cancelled' to the existing enum values

-- Step 1: Check current ENUM values
SHOW COLUMNS FROM `order_items` LIKE 'status';

-- Step 2: Modify the ENUM to include new values
ALTER TABLE `order_items` 
MODIFY COLUMN `status` ENUM('pending', 'completed', 'preparing', 'ready', 'cancelled') 
NOT NULL DEFAULT 'pending';

-- Step 3: Add special_instructions column if it doesn't exist
ALTER TABLE `order_items` 
ADD COLUMN IF NOT EXISTS `special_instructions` TEXT NULL AFTER `status`;

-- Step 4: Verify the changes
SHOW COLUMNS FROM `order_items` LIKE 'status';
SHOW COLUMNS FROM `order_items` LIKE 'special_instructions';

-- Rollback script (if needed):
-- ALTER TABLE `order_items` 
-- MODIFY COLUMN `status` ENUM('pending', 'completed') NOT NULL DEFAULT 'pending';
-- ALTER TABLE `order_items` DROP COLUMN `special_instructions`;

