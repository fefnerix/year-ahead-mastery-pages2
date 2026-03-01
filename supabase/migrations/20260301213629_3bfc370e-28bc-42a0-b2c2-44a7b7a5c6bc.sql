
ALTER TABLE journal_entries DROP CONSTRAINT journal_entries_month_id_fkey;
ALTER TABLE journal_entries ADD CONSTRAINT journal_entries_month_id_fkey FOREIGN KEY (month_id) REFERENCES months(id) ON DELETE SET NULL;
