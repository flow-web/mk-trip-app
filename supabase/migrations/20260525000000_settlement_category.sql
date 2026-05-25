-- Add 'settlement' to expense_category enum for tracking reimbursements
ALTER TYPE public.expense_category ADD VALUE IF NOT EXISTS 'settlement';
