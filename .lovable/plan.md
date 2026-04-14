

## Add Resend Transport to send-notifications Edge Function

### Context
- `RESEND_API_KEY` secret already exists
- `send-notifications/index.ts` currently uses SMTP-only via nodemailer
- No Resend code exists in the function yet
- The audit doc confirms Resend is already used by `send-job-notification` — this aligns the transport strategy

### Changes (single file: `supabase/functions/send-notifications/index.ts`)

#### 1. Add Resend SDK import and config
- Import Resend SDK: `import { Resend } from "npm:resend@4.1.2"`
- Read `RESEND_API_KEY` and `RESEND_FROM` (fallback to `SMTP_FROM`) from env
- Create conditional Resend client (only if API key is set)

#### 2. Update `sendEmail()` with Resend-first, SMTP-fallback
- Try Resend first if the client is available
- On Resend success, return immediately
- On Resend failure, log the error and fall through to existing SMTP path
- If both fail, return a combined error message
- If neither provider is configured, return a clear error

#### 3. Deploy the updated function
- Call `deploy_edge_functions` after writing changes

### No other files change
- No new secrets needed (`RESEND_API_KEY` already exists, `RESEND_FROM` is optional with fallback)
- No database changes
- No frontend changes

