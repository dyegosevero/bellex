-- Remove triggers antigos que referenciam workspace_licenses (schema obsoleto)
DROP TRIGGER IF EXISTS clinic_seat_on_change ON workspace_clinics;
DROP TRIGGER IF EXISTS clinic_seat_on_insert ON workspace_clinics;

-- Workspace principal: Bellex SAAS (dyego@efkz.com.br)
-- Executado manualmente via Management API em 2026-06-25
-- INSERT já aplicado, este arquivo serve como documentação da seed

-- workspace_customers id: 647f9453-8e3d-457d-bf70-83b010ccecbf
-- clinics vinculadas: Studio 13 (studio13), Espaço Vip (espaco-vip)
