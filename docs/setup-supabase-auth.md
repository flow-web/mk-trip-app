# Supabase Auth — Redirect URLs to configure manually

In Supabase Dashboard → Authentication → URL Configuration → add to "Redirect URLs":

- `http://localhost:3000/auth/callback` (dev)
- `https://<vercel-preview-domain>/auth/callback` (preview, after Vercel link in Task 14)
- `https://<production-domain>/auth/callback` (prod, once known)

Site URL : `http://localhost:3000` for dev, will update to production URL later.
