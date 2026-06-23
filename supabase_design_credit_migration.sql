-- Migration: Add design credit tracking columns to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS design_credit_enabled BOOLEAN DEFAULT false;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS design_credit_amount INTEGER DEFAULT NULL;
