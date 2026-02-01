-- Trigger: on_insert_set_org_id on public.clients
-- Database trigger that automatically executes in response to certain events

CREATE TRIGGER on_insert_set_org_id BEFORE INSERT ON public.clients FOR EACH ROW EXECUTE FUNCTION auto_assign_org_id();
