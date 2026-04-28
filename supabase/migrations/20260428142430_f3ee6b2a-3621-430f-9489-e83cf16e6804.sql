-- Изчистване на тестови финансови данни
DELETE FROM public.subscriptions;
DELETE FROM public.donations;
UPDATE public.campaigns SET current_amount = 0 WHERE current_amount <> 0;