-- Mapa facial na proposta: guarda as áreas marcadas por pilar em cada orçamento.
-- Formato: {"sustentacao": ["2","13"], "estruturacao": ["10","10E"], ...}
--
-- Aditivo e idempotente: cria uma coluna nova, anulável, sem default.
-- Não lê, não altera e não apaga nenhum dado existente. Orçamentos antigos
-- ficam com NULL e continuam funcionando (a tela simplesmente não mostra o slide).
--
-- Rodar uma vez no SQL Editor do Supabase.

ALTER TABLE quotes ADD COLUMN IF NOT EXISTS face_zones jsonb;

-- Conferência: deve retornar uma linha com data_type = jsonb
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'quotes' AND column_name = 'face_zones';
