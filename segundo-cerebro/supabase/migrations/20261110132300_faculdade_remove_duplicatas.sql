-- faculdade_itens: "dono_tudo" é idêntica a "faculdade_itens_dono" (ALL, authenticated, is_dono())
drop policy if exists dono_tudo on public.faculdade_itens;
-- faculdade_sync: "faculdade_sync_dono" (SELECT) já está coberta por "dono_tudo" (ALL)
drop policy if exists faculdade_sync_dono on public.faculdade_sync;
-- hash: a constraint faculdade_itens_hash_key já garante unicidade; o índice parcial é redundante
drop index if exists public.faculdade_itens_hash_uq;
