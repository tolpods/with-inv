# Tolpods investor portal (prototype)

Pages (all under `/investors/`):

| Page | Who | What |
|---|---|---|
| `index.html` | Investors | Invite link or email + 5-character code -> emailed one-time code -> details -> NDA (e-sign, PDF) -> presentation site -> SAFE (e-sign, PDF) |
| `admin.html` | Admins (KJ / Mahesh) | Email + one-time code sign-in. Screen 1: add admin users. Screen 2: invite investors (generates the 5-character code, sends the invite). Settings: Calendly / Google Calendar links |
| `dashboard.html` | Admins | Separate page: pipeline, NDAs, SAFEs, amounts, address checks, deck progress, support inbox, activity log, CSV export |

## Running it
Static files, no build step. Serve the site folder (`python3 -m http.server`) or publish on GitHub Pages.
Open `admin.html`, sign in as `kj@tolpods.com`, and read the code in the **Dev mailbox** (bottom right).

## IMPORTANT: this is a prototype backend
`CONFIG.mode = 'mock'` keeps all data in the browser (localStorage) and shows emails in the Dev mailbox.
Nothing is secure or shared between people yet. Before real investors use it, replace `js/api.js` with real services:

* Auth, invites, one-time codes, saved progress, tickets: Firebase Auth/Firestore, Supabase, or your own server.
* Email (codes, invites, signed PDF copies): Resend or SendGrid, sent from the server.
* PDFs: generate on the server (the browser version in `js/docs.js` is the reference layout).
* Store the signature, timestamp, IP address and document hash with each signed PDF (the audit trail).
* The OTP must be checked on the server. Never trust the browser for who is an admin.
* Address verification: add a Google Address Validation key in `js/config.js` (`googleAddressKey`). Without it the page uses OpenStreetMap and then a format check.

All backend calls are the exported functions in `js/api.js`, so swapping is one file.

## Legal - please read
`js/docs.js` contains a draft NDA and a simplified SAFE-style agreement. They are templates, not legal advice.
Have your attorney replace them (the official Y Combinator post-money SAFE is the usual choice) and review the securities-law side
(accredited-investor verification, Regulation D / Form D filings, state notices). Then set `legalApproved: true` in `js/config.js`
to remove the "draft" line from every PDF. The NDA text, company name (No Fak Tolpods Inc., Tempe, AZ) and Arizona governing law come from the NDA you supplied. The SAFE text is still a draft.

## Content
`js/deckdata.js` is generated from the investor deck. The presentation site (`js/present.js`) reads from it.
Edit the numbers there if the deck changes.

## The presentation (`js/present.js`, `css/present.css`)
A full-screen, slide-by-slide flow (17 slides) instead of a scrolling website. Keys: `→`/space next (reveals builds, then the next slide),
`←` back, `G` all slides, `P` auto-play, `F` full screen. Swipe on phones. Each slide is one function-built block in `slidesFor()`;
`data-b="n"` marks the n-th build step on a slide.
- Charts: dependency-free SVG in `js/charts.js` (bars, stacked bars, lines, donuts). Two simulators (occupancy break-even, stake value).
- Booking: two generic cards, "Investment questions" and "Product questions" (`CONFIG.calendar`, editable in Admin > Settings).
  Older saved CEO/CTO settings are mapped onto these automatically.
- **Sources.** Market slides cite what was checked: TSA record (3.13M, late Nov 2025, via KSL), IATA (4.98B in 2025, 5.2B forecast 2026, via RTE),
  ACI (9.8B airport passengers 2025; 39.9% non-aeronautical share, FY2017, via Moodie Davitt), USAFacts/BTS (~25% of domestic flights late, Q2 2025).
  The TSA date and the "13.6M a day" cross-check are our own inference/arithmetic. Re-verify all of these before sending to investors.
- The occupancy and stake slides use a simple model derived from the deck (rent 35% of gross; break-even about 59% booked). Stake values
  are before dilution and are illustrative only; have counsel review the wording.

## Notes for this version
- **NDA** now uses your Mutual NDA wording (Party A = No Fak Tolpods Inc., Party B = the investor). Party B's name, address, contact and, for entities, state of incorporation, place of business and signer name/title are filled in automatically from the details form. Party A is shown as a printed name and date (no signature image); add a countersignature step if you want one.
- **Signed NDA PDF** is stored with the investor and can be downloaded any time: from the investor's own top bar ("Signed NDA") and from the admin dashboard (investor table "PDF" link and the investor detail panel).
- Only the Stage 1 (seed, $300k) options are shown, in the presentation and in the SAFE step.
- Home page has Investors and Admin sign-in buttons in the top bar.
