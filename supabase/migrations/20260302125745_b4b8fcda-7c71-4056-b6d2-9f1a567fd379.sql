-- Add category column to month_tasks using existing task_category enum
ALTER TABLE public.month_tasks 
ADD COLUMN category public.task_category NULL;