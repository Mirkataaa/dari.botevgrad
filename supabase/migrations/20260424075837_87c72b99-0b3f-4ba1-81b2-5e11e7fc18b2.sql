DELETE FROM public.donations;
DELETE FROM public.subscriptions;
UPDATE public.campaigns SET current_amount = 0;