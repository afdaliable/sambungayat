# Security

Please report vulnerabilities privately, not in a public issue: use GitHub's "Report a vulnerability" button (private security advisory) or write to halo@sambungayat.com. Include what you found, where, and how to reproduce it. You will get an answer within a few days.

Things we care about most: anything that could change Quran text or audio shown to users, leak data stored on a device, break the Content-Security-Policy in `public/_headers`, or abuse the public counter (`functions/api/stats.ts`).

There are no accounts and no passwords. Do not test against the production counter beyond a few requests.
