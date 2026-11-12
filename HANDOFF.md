# Haggle Bot — Development Handoff

Everything needed to continue development on a different device. Current as of the pushed state on **2026-11-12**.

---

## 1. Repository & current state

- **Remote:** https://github.com/benzing11/Haggle-Bot.git
- **Branch:** `main`
- **HEAD / origin/main:** `5b98861` — `fixed ui + merchant side added` (pushed; working tree clean on the source machine)
- **Git identity used on source machine:** `benzing11` / `bensingh207@gmail.com`
- **Pending collaborator invite:** https://github.com/benzing11/Haggle-Bot/invitations  
  - Invitee: `nambi-023` (GitHub user id 296938321)  
  - Permission requested: **write**  
  - Invitation id: `343046096` (not expired at time of check)  
  - Status: **not yet accepted** (not a collaborator yet). `nambi-023` must accept at the invitations URL while logged into GitHub.

> `.gitignore` excludes (not in repo): `node_modules/`, `.next/`, `.env*` (except `.env.example`), build artifacts, etc. You must recreate dependencies, build output, and local env on the new device.

---

## 2. Prerequisites

| Tool | Version on source machine | Notes |
| --- | --- | --- |
| Node.js | `v24.19.0` | Next 16 app; use a recent Node 20+ (match closely if you hit issues). |
| npm | `11.17.0` | Comes with Node; lockfile is `package-lock.json`. |
| Git | installed | Needed to clone/push. |
| GitHub access | account with repo access | `benzing11` owns the repo; `nambi-023` has a pending write invite. On the new device sign in (`gh auth login` or configure HTTPS/SSH credentials). **Do not copy auth tokens in plaintext.** |

Optional: `gh` (GitHub CLI) for managing invites/collaborators from the terminal.

---

## 3. Clone, install, run

```bash
git clone https://github.com/benzing11/Haggle-Bot.git
cd Haggle-Bot
npm install

cp .env.example .env.local
# Fill in .env.local values (see section 4)

npm run dev      # http://localhost:3000
```

**Checks:**
```bash
npm run build    # production build (Next.js; routes: /, /merchant, /api/*)
npm run lint     # eslint
npx tsc --noEmit # typecheck
```

**Dev server note:** use the project’s scripts (`next dev` / `next build`). If you bind a custom port, e.g. `npm run dev -- --port 3100`, ensure the port is free.

---

## 4. Environment variables (`.env.local` — never commit)

- **Template:** `.env.example` (committed). Copy it to `.env.local`.
- **I cannot read `.env.local` from this environment**, so the actual secret values currently set on the source machine are **not printed here**.  
  **Action:** securely copy `Haggle-Bot/.env.local` from the source device to the new one, **or** recreate it from `.env.example` and re-enter each value from its original source (dashboards/generators below).
- `.env.local` is gitignored. Never commit it, never paste secrets into chat/client code, and never put them in public assets.

### 4.1 Every variable the app uses

| Variable | Required | Purpose | Default / where to get the value |
| --- | --- | --- | --- |
| `GROQ_API_KEY` | **Yes** (default provider) | Groq API key for Brindle (haggle + merchant opening-line preview) | *(secret)* — [console.groq.com](https://console.groq.com) → **API Keys**. |
| `GROQ_MODEL` | No | Groq model used for Brindle | Default: `openai/gpt-oss-120b` (must support tool calling). Override via env. |
| `ANTHROPIC_API_KEY` | No (alternative provider) | Anthropic key; used **only when `GROQ_API_KEY` is empty** | *(secret)* — Anthropic console. |
| `ANTHROPIC_MODEL` | No | Anthropic model when using Anthropic path | Default: `claude-sonnet-5-5`. |
| `PAYPAL_CLIENT_ID` | **Yes** (for checkout) | PayPal REST app Client ID (sandbox), server-side | *(sensitive)* — PayPal Developer app (see 5.2). |
| `PAYPAL_CLIENT_SECRET` | **Yes** (for checkout) | PayPal REST app Secret (sandbox), server-side | *(secret)* — PayPal Developer app (see 5.2). |
| `NEXT_PUBLIC_PAYPAL_CLIENT_ID` | **Yes** (for checkout UI) | Same value as `PAYPAL_CLIENT_ID`; intentionally exposed to the browser | Same as `PAYPAL_CLIENT_ID`. This is the only PayPal value meant to be public. |
| `PAYPAL_API_BASE` | No | PayPal REST API base URL | Default: `https://api-m.sandbox.paypal.com` (sandbox). **Do not point at live unless intended.** |
| `DEAL_SIGNING_SECRET` | **Yes** | HMAC-SHA256 secret for the 10-minute signed deal token (mint/verify) | *(secret, 32+ random chars).* Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |

### 4.2 Where variables are referenced (code)

- `lib/brindle.ts` — `GROQ_API_KEY`, `GROQ_MODEL`, `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`
- `app/api/merchant/preview/route.ts` — `NODE_ENV` (non-production error detail only)
- `lib/paypal.ts` — `PAYPAL_API_BASE`, `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`
- `lib/deal-token.ts` — `DEAL_SIGNING_SECRET`, `NODE_ENV`
- `components/haggle/paypal-checkout.tsx` — `NEXT_PUBLIC_PAYPAL_CLIENT_ID`

### 4.3 Behaviour when values are missing

- **No model key** (`GROQ_API_KEY` empty and no `ANTHROPIC_API_KEY`): Brindle fails honestly (“abacus jammed” / env setup message), no fake replies.
- **No PayPal keys:** contract/checkout shows a setup notice; deal token can still be minted but checkout cannot complete.
- **No `DEAL_SIGNING_SECRET`:** deal token signing/verification fails.

---

## 5. Accounts, credentials, and where to obtain them

> **Important:** Logins, passwords, and API secrets are **not stored in the repo**. I cannot retrieve or display secret values from `.env.local`. Obtain them from the sources below or securely copy `.env.local` from the source machine.

### 5.1 Groq (AI — default provider)

- **Account:** your Groq account (email/password = your Groq login; not in repo).
- **API key:** [console.groq.com](https://console.groq.com) → **API Keys** → create/copy key into `GROQ_API_KEY`.
- **Model to use (default):** `openai/gpt-oss-120b` (supports tool calling, required by Brindle). Set/override with `GROQ_MODEL` if needed.

### 5.2 PayPal Developer — sandbox (payments)

- **Account:** your PayPal developer login at [developer.paypal.com](https://developer.paypal.com) (email/password not in repo). **Never use a real PayPal account in sandbox.**

**A. Sandbox Merchant/Business app (Client ID & Secret)**
1. Dashboard → **Apps & Credentials** → toggle **Sandbox** → **Create App** (Type: **Merchant**, e.g. name `Haggle Bot`).
2. Copy **Client ID** and **Secret**.
3. Set in `.env.local`:
   - `PAYPAL_CLIENT_ID=<Client ID>`
   - `PAYPAL_CLIENT_SECRET=<Secret>`
   - `NEXT_PUBLIC_PAYPAL_CLIENT_ID=<same Client ID>`
4. Keep `PAYPAL_API_BASE=https://api-m.sandbox.paypal.com`.

> **If approval fails with `UNSUPPORTED_PAYEE_CURRENCY`** (“Things don’t appear to be working at the moment”): the sandbox **business** (payee) account behind that Client ID can’t receive the order’s currency. Fix the payee account, not the code: **Testing Tools → Sandbox Accounts → Create Account** → *United States* → *Business*, then create a **new app** under that account and replace `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, and `NEXT_PUBLIC_PAYPAL_CLIENT_ID`.

**B. Sandbox Buyer test account (mail + password for the PayPal popup)**
- Dashboard → **Testing Tools → Sandbox Accounts** → open the auto-created **Personal (buyer)** account → **reveal its email and password**.
- Use these credentials to log in inside the PayPal approval popup during test payments.
- These are **sandbox test credentials only**; they are not stored in the repo. Copy them from the PayPal dashboard on the new device/account.

### 5.3 Anthropic (optional alternative AI provider)

- **Account:** your Anthropic account (login not in repo).
- **API key:** Anthropic console → create key into `ANTHROPIC_API_KEY`.
- **Model (default):** `claude-sonnet-5-5` (`ANTHROPIC_MODEL`).
- **Activation:** Anthropic path is used only when `GROQ_API_KEY` is empty/unset; keep `GROQ_API_KEY` empty to run Brindle on Claude.

### 5.4 Deal signing secret

- **Value:** any long random string (32+ chars) for `DEAL_SIGNING_SECRET`.
- **Generate:** `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- Changing it invalidates previously minted deal tokens (tokens are short-lived, ~10 minutes).

### 5.5 GitHub

- **Repo:** https://github.com/benzing11/Haggle-Bot.git (owner: `benzing11`)
- **Collaborator invite:** https://github.com/benzing11/Haggle-Bot/invitations — `nambi-023`, write, pending acceptance.
- **Auth on new device:** sign in with your GitHub account (`gh auth login` or git credential manager / SSH key). Source machine had `gh` authenticated as `benzing11` with `repo` scope; tokens/keys must be configured fresh on the new device (do not copy secrets).

### 5.6 Services NOT required

- No database. State is in-browser transcript; durable truths are the signed deal token and PayPal’s order record.
- No npm registry login required to install public deps.
- No other third-party APIs/keys beyond Groq (or Anthropic) and PayPal sandbox.

---

## 6. AI model & provider behaviour (as implemented)

- **Default provider:** Groq (OpenAI-compatible chat completions with tool use).
  - Env: `GROQ_API_KEY`, `GROQ_MODEL` (default `openai/gpt-oss-120b`).
  - Used for: negotiation (`POST /api/negotiate`) and merchant opening-line preview (`POST /api/merchant/preview`).
- **Alternative provider:** Anthropic (`@anthropic-ai/sdk`), used only if `GROQ_API_KEY` is empty.
  - Env: `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL` (default `claude-sonnet-5-5`).
- **Pricing/truth model:** AI proposes; server clamps/enforces. Floor prices live server-side (`lib/products.server.ts`, `server-only`) and are never sent to the browser. Valid deals are minted as HMAC-SHA256 signed tokens; PayPal order amount is created from the verified token (client never supplies amount).

---

## 7. App structure & key routes (quick map)

| Path | Type | Purpose |
| --- | --- | --- |
| `/` | page | Shelf → Room → Deal → Paid flow (single-page state machine) |
| `/merchant` | page | Merchant portal (no auth): configure listing, preview Brindle’s opening line |
| `/api/negotiate` | POST | Haggle with Brindle (structured tool response), server-clamped, mints deal token on valid deal |
| `/api/merchant/preview` | POST | Generate Brindle’s opening line for a merchant listing (plain text, low reasoning effort) |
| `/api/paypal/create-order` | POST | Verifies signed deal token, creates PayPal Orders v2 order for token price |
| `/api/paypal/capture-order` | POST | Captures PayPal order, returns capture/charged amount for receipt |

**Merchant notes:** listings are **in-memory only** (survive client navigation, cleared on refresh by design). Floor price is never returned to the browser.

---

## 8. Stack (from `package.json`)

- **Framework:** Next.js 16.4.6 (App Router), React 19.3, TypeScript 5
- **Styling/UI:** Tailwind CSS 4.3, shadcn/base-ui primitives, `tailwind-merge`, `class-variance-authority`, `tw-animate-css`, `lucide-react`
- **Motion/UX:** `motion`, `lenis`, `@number-flow/react`, `gsap`, `canvas-confetti`, `sonner`
- **3D:** `three`, `@react-three/fiber`, `@react-three/drei`
- **AI:** `@anthropic-ai/sdk` (Groq used via OpenAI-compatible fetch in `lib/brindle.ts`)
- **Payments:** `@paypal/react-paypal-js`, PayPal REST Orders v2
- **Tokens/validation:** `jose`, Node `crypto` HMAC-SHA256, `zod`

---

## 9. Security checklist

- [ ] Keep `.env.local` local and untracked; never commit secrets.
- [ ] `NEXT_PUBLIC_PAYPAL_CLIENT_ID` is intentionally public; **all other keys/secrets stay server-side** (`PAYPAL_CLIENT_SECRET`, `GROQ_API_KEY`, `ANTHROPIC_API_KEY`, `DEAL_SIGNING_SECRET`).
- [ ] Do not paste API keys, client secrets, PayPal sandbox buyer passwords, or tokens into chat, issues, or client code.
- [ ] If a secret is lost or exposed, **rotate/regenerate** it at its source (new Groq/Anthropic key, new PayPal app secret, new `DEAL_SIGNING_SECRET`) and update `.env.local` on every device that needs it.
- [ ] Configure GitHub auth freshly on the new device; do not reuse copied tokens.
- [ ] Use sandbox PayPal only unless you explicitly intend to go live (and update `PAYPAL_API_BASE`/apps accordingly).

---

## 10. Quick verification after setup

1. `npm install` completes without errors.
2. `.env.local` contains required values (`GROQ_API_KEY` or `ANTHROPIC_API_KEY`, PayPal trio, `DEAL_SIGNING_SECRET`).
3. `npm run dev` → open http://localhost:3000, haggle with Brindle on a shelf item (confirms model key).
4. Visit `/merchant`, create/save a listing and confirm opening-line preview (confirms preview path + model).
5. Complete a deal and approve with the **sandbox Personal (buyer)** email/password in the PayPal popup (confirms PayPal sandbox config).
6. `npm run build` and `npm run lint` pass.
