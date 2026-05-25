-- Add estimated_cost field to spots for budget forecasting
ALTER TABLE public.spots ADD COLUMN estimated_cost bigint NOT NULL DEFAULT 0;
