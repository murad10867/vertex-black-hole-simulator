# Security Policy

This static GitHub Pages project uses:
- HTTPS enforcement in production.
- A restrictive Content Security Policy.
- No inline JavaScript.
- External-link hardening.
- Blocking of unsafe URL schemes.
- Frame-busting against unauthorized embedding.

Never commit private API keys, passwords, payment secrets, GitHub tokens, or Supabase service-role keys.
If a secret is accidentally committed, rotate it immediately.
