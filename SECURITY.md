# Security Policy

## Supported Versions

| Version | Supported |
|---|---|
| `main` branch | Yes |

## Reporting a Vulnerability

Please **do not** open a public GitHub issue for security vulnerabilities.

Instead, report them via email to: **admin@proflowlabsai.com**

Include:
- A description of the vulnerability
- Steps to reproduce
- Potential impact
- Any suggested fix (optional)

We aim to acknowledge reports within 48 hours and provide a fix or mitigation plan within 14 days.

## Scope

In scope:
- SQL injection, XSS, CSRF in the web application
- Authentication bypass or privilege escalation
- Sensitive data exposure (user emails, watchlist data)
- API endpoint abuse (rate limiting bypass, unauthorized access)

Out of scope:
- Denial of service attacks
- Issues in third-party dependencies without a proven exploit path
- Scraping the scraper (the data is public)
