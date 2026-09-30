# NONOBJECT visual studio

A complete local website implementation based on `ecommerce-visual-studio-prd-for-codex.md` and the supplied scroll-craft instructions.

## Run

Requires Node 22.12+ and npm.

```sh
npm install
npm run dev
```

Open http://localhost:5173. The preview server binds to localhost. The form saves preview enquiries in a local private folder and explicitly says they are not sent to the studio.

GitHub Pages publishes a **static demo** at [tolcotu.github.io/nonobject-studio](https://tolcotu.github.io/nonobject-studio/). The demo validates short project briefs in the browser, then downloads a JSON brief to the visitor’s device. It does not submit contact details or files to GitHub Pages or the studio. The full persistent enquiry and notification service requires a separate server host with private storage.

GitHub Actions builds the Pages release from `main` using `npm run build:pages`. Do not remove the preview flag or point a public Pages build at the local-storage API. Enable Pages source as GitHub Actions in repository settings.

```sh
npm test
npm run build
npm run build:pages
npm start
```

Production serves `dist/` and the enquiry API on the same origin. `PORT` defaults to 5173. Set `HOST=0.0.0.0` only when deploying behind the intended proxy. Production submissions are disabled until launch configuration is complete.

The current visual direction and the generated hero prompt are documented in [docs/VISUAL-REFINEMENT.md](docs/VISUAL-REFINEMENT.md).

## What is included

- NONOBJECT identity, an opening composed from supplied product work, and three galleries of supplied product listing work: an Amazon sieve set, a baking dish set, and a serving tray set.
- Portfolio-led editorial hero, browsable project galleries, one real product-to-visual research example, pricing, FAQ and a short project brief form.
- Responsive layouts, reduced-motion alternative, keyboard dialogs and visible focus.
- Optional brief-level attachments, browser/server validation, unique request IDs, durable private storage and idempotent save retries.
- SMTP owner/client messages and Telegram adapters with persisted per-channel delivery status and a retry command.
- A downloadable request summary, accurate local-preview success state, legal/company placeholders and a Polish contact entry.

## Launch configuration

Copy `.env.example` to `.env` and fill in values locally. Do not commit secrets.

1. Supply actual studio company/contact information and approved privacy/cookie/terms notices. Set `LEGAL_NOTICE_FILE` to a private JSON file in this format:

```json
{
  "company": ["Company & contact", ["Approved company details and real contact channels."]],
  "privacy": ["Privacy policy", ["Approved controller, purpose, legal basis, processors, retention and rights information."]],
  "cookies": ["Cookies", ["Approved cookie information."]],
  "terms": ["Terms of service", ["Approved commercial and legal terms."]]
}
```

This example is a schema, not approved legal text. The frontend displays supplied notices when live submissions are enabled.

2. Set `PUBLIC_ORIGIN` to the real HTTPS origin; set `ENQUIRIES_ENABLED=true` only after those notices are approved.
3. Configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` and `OWNER_EMAIL`. Configure `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` if desired. Credentials must stay server-side.
4. Choose a private persistent `DATA_DIR` outside the served tree, with backups and restricted access. Local `.data` is excluded from source control and denied by Vite. The API never exposes uploaded files as public URLs.
5. Confirm the proposed upload limits and commercial terms in [docs/ANALYSIS.md](docs/ANALYSIS.md).
6. Add client names, listing links or performance figures only when the studio supplies and approves them. Current galleries use the supplied product imagery without inventing attribution or outcomes.

**Not configured:** production enquiry hosting, real legal/company details, notification credentials, Google Drive storage, automated retention/deletion and malware scanning. The public GitHub Pages site is a static demo, not the production enquiry service. Google Drive is the PRD's preferred final-delivery destination; initial enquiry storage currently uses private server files.

## Data and reliability

`DATA_DIR/enquiries/<idempotency-key-hash>/enquiry.json` contains the request ID, contact details, the broad product-count range, project choices, attachment metadata and notification status. Optional files are stored in a private `Attachments/` directory. Request-ID lookup is available inside the JSON records; there is intentionally no unauthenticated admin or file-download endpoint.

Files are optional and limited to six attachments of 10 MB each. Images are checked by signature and decoded before acceptance; PDFs are checked by signature. Incoming files use random temporary names, are removed after failed attempts and are never executed or served. Complete enquiries are persisted before notifications run. Retries with the same submission key return the existing request; a failed save does not clear the browser fields.

The rate limiter is process-local, using socket IPs. For production behind a trusted proxy, explicitly configure trusted proxy handling and use an edge/shared rate limiter. Add disk quotas and a private file scanning service if required by the chosen hosting environment. A process crash can leave temporary files; include private pending-folder cleanup in operations. Do not deploy `.data` as static files.

Notification delivery status is saved after each channel. Run the following on the server to retry unconfigured/failed channels after fixing configuration:

```sh
npm run retry-notifications
```

This sends messages for existing **live** enquiries and skips preview records and channels already marked sent. Run only one retry worker at a time. Provider success followed by a process/storage crash can lead to at-least-once redelivery; stable email Message-IDs reduce ambiguity, but exactly-once external delivery is not promised.

Do not retain enquiries indefinitely. The owner must approve a separate enquiry retention period and deletion procedure before launch. The PRD's one-month rule concerns completed delivery files and must not be silently reused for all personal enquiry data. No personal form data is stored in browser localStorage or query strings. No advertising analytics/cookies are installed.

## Verification

```sh
npm test
npm run verify
node scripts/interactions.mjs
```

Browser scripts use local Chrome at the macOS path. Change `executablePath` for another system. They run headlessly and disable native pointer capture/lock. `scripts/interactions.mjs` starts an isolated preview server, exercises actual uploads/storage, then removes its temporary test data. No notification messages are sent by verification.

See [docs/VERIFICATION.md](docs/VERIFICATION.md), [docs/ANALYSIS.md](docs/ANALYSIS.md), and `scrollcraft/builds/nonobject/BRIEF.md` for decisions, evidence and limits. Original generated PNGs remain in the generator's output directory; all assets needed to run the site are copied and optimized into `public/`.
