-- Trigger: trg_set_paid_at on public.bookings
-- Database trigger that automatically executes in response to certain events

CREATE TRIGGER trg_set_paid_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION handle_payment_date();
