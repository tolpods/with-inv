/* Tolpods investor portal - configuration.
   Everything you are likely to change lives here (or in Admin > Settings). */
export const CONFIG = {
  // 'mock' = prototype: data lives in this browser (localStorage) and e-mails show in the on-screen Dev mailbox.
  // 'live' = send every API call to liveApiBase (see investors/README.md for the contract).
  mode: 'mock',
  liveApiBase: '',

  company: 'Tolpods',
  companyLegal: 'TolPods Inc.',   // used in the NDA and SAFE (from the landing page footer - confirm with counsel)
  governingLaw: 'the State of Nevada',   // ASSUMED from the Las Vegas address - confirm with counsel
  legalApproved: false,    // set true once counsel has approved the NDA/SAFE templates (removes the "draft" footer line)

  // Admins who can sign in at /investors/admin.html (first run only; later managed in the Admin screen).
  adminSeed: [
    { name: 'KJ',     email: 'kj@tolpods.com',     role: 'owner' },
    { name: 'Mahesh', email: 'mahesh@tolpods.com', role: 'owner' }
  ],
  fromEmail: 'Tolpods Investor Relations <investors@tolpods.com>',
  supportEmail: 'investors@tolpods.com',

  // Scheduling pages (Calendly and/or Google Calendar appointment page). Editable in Admin > Settings.
  // Two generic booking topics (no named people): investors pick the kind of question, you decide who answers.
  calendar: [
    { id: 'investment', label: 'Investment questions', blurb: 'The round, the SAFE, ownership, timing and risk. Ask anything about the terms.', calendly: '', google: '' },
    { id: 'product',    label: 'Product questions',    blurb: 'The tolpod, the technology, airport rollout and operations. Ask anything about how it works.', calendly: '', google: '' }
  ],

  // Address verification. With a Google Address Validation API key it uses Google; otherwise OpenStreetMap
  // (Nominatim), otherwise a basic format check. Restrict the key to your site's domain in Google Cloud.
  googleAddressKey: '',

  // Investor invitation code format: 'digits' (5-digit number, easiest on a phone keypad) or 'alnum' (letters + numbers).
  inviteCode: { length: 5, charset: 'digits' },

  otp: { length: 6, ttlMin: 10, maxTries: 5, resendSec: 30 },
  sessionMin: 90
};
