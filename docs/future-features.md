# Future features

Planned work that is **not implemented yet**. Use this doc for roadmap discussions; do not treat items here as shipped behavior.

**Related:** [Auth email verification & delivery](./auth-email-verification.md) (current behavior + gaps).

---

## 1. Unified email template system

### Goal

One consistent Pryrox look for all outbound email — not split between Supabase dashboard templates and ad‑hoc HTML in `src/lib/email/`.

### Principles

| Layer | Owner | Notes |
|--------|--------|--------|
| **Layout** (logo, footer, colors) | Repo defaults | Shared wrapper for every email type |
| **Content** (subject + body) | Repo defaults + optional DB overrides | Platform admin can edit copy later |
| **Delivery** | Single mailer (SMTP / Resend) | Supabase Auth only generates links, does not send marketing-style mail |
| **Auth links** | `auth.admin.generateLink` | Signup confirm + password reset always use our templates |

### Template keys (initial set)

| Key | Trigger |
|-----|---------|
| `auth.signup_confirm` | After sign-up |
| `auth.password_reset` | Forgot password |
| `auth.staff_invite` | Staff invite / resend (replace standalone `staff-invite.ts` body) |
| `billing.payment_receipt` | Successful checkout |
| `platform.admin_notice` | Rare platform alerts |

### Admin UI (phase 2)

- List templates with **preview** (desktop + mobile width).
- Edit **subject** + **HTML body** with documented placeholders (`{{pharmacyName}}`, `{{actionUrl}}`, etc.).
- **Reset to default** from repo.
- Store in `platform_email_templates` (`key`, `subject`, `body_html`, `updated_at`).
- Sanitize HTML (allowlist tags) — no arbitrary scripts.

### Out of scope (for now)

- Per-pharmacy custom email branding (use pharmacy name in variables only).
- Full WYSIWYG for every email type on day one.
- Duplicating the same template in Supabase Auth dashboard **and** Pryrox — single source of truth in Pryrox.

### Implementation order (suggested)

1. Shared layout component + migrate `lib/email/templates.ts` and `staff-invite.ts`.
2. Route **all** auth mail through `generateLink` + mailer (drop reliance on Supabase sending for confirm/reset).
3. `platform_email_templates` table + admin read/edit + fallback to code defaults.
4. Optional: React Email or MJML for maintainability.

---

## 2. Auth verification & email delivery resilience

**Shipped:** resend API, `/verify-email`, `/auth/confirm`, sign-in unconfirmed UX. Details in **[auth-email-verification.md](./auth-email-verification.md)**.

### Remaining improvements

| Feature | Priority | Description |
|---------|----------|-------------|
| **Admin: email delivery log** | Low | Last send status per user (provider, error) for support. |
| **Align with unified templates** | High | Same layout as item 1 above. |
| **Supabase redirect URL** | Ops | Add `{APP_URL}/auth/confirm` to allowed redirect URLs in Supabase dashboard. |

---

## 3. Other backlog (short)

| Area | Idea |
|------|------|
| **EBM / RRA** | Live RRA EBM API integration; fiscal receipt after POS sale |
| **Global search** | Extend Ctrl+K to staff, branches, more admin entities |
| **Email** | Per-locale templates (EN / Kinyarwanda) |

---

## Document maintenance

When a feature ships, move it from this file into `docs/modules/` or `docs/feature-status.md` and delete or shorten the section here.
