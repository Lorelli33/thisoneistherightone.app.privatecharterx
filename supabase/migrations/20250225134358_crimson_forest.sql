/*
  # Update Company Logo URL

  1. Changes
    - Updates the company_settings table with a new logo URL
*/

-- Update company settings with the new logo
UPDATE company_settings
SET logo_url = 'https://raw.githubusercontent.com/stackblitz/private-jet-icons/main/x-logo.webp',
    updated_at = now()
WHERE logo_url IS NULL OR logo_url = 'https://raw.githubusercontent.com/stackblitz/private-jet-icons/main/logo.webp';