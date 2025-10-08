-- 404 Sayfa Logları Tablosu
CREATE TABLE IF NOT EXISTS not_found_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url VARCHAR(500) NOT NULL UNIQUE,
  hit_count INTEGER DEFAULT 1,
  status VARCHAR(20) DEFAULT 'active', -- active, redirected, gone_410
  redirect_to VARCHAR(500),
  first_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index'ler
CREATE INDEX IF NOT EXISTS idx_not_found_logs_url ON not_found_logs(url);
CREATE INDEX IF NOT EXISTS idx_not_found_logs_status ON not_found_logs(status);
CREATE INDEX IF NOT EXISTS idx_not_found_logs_hit_count ON not_found_logs(hit_count DESC);
CREATE INDEX IF NOT EXISTS idx_not_found_logs_last_seen ON not_found_logs(last_seen_at DESC);

-- Trigger: updated_at otomatik güncelleme
CREATE OR REPLACE FUNCTION update_not_found_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_not_found_logs_updated_at
  BEFORE UPDATE ON not_found_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_not_found_logs_updated_at();

-- İlk veri kontrolü
SELECT 'not_found_logs tablosu oluşturuldu!' as message;

