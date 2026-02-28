# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.x.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability in IntlParty, please report it responsibly.

**Do not open a public GitHub issue for security vulnerabilities.**

Instead, please email security concerns to: **rodrigo.espinosa.bermedo@gmail.com**

### What to Include

- Description of the vulnerability
- Steps to reproduce the issue
- Potential impact
- Suggested fix (if any)

### Response Timeline

- **Acknowledgment**: Within 48 hours
- **Initial Assessment**: Within 1 week
- **Fix & Disclosure**: Coordinated with reporter

### Process

1. Report is received and acknowledged
2. We investigate and confirm the vulnerability
3. A fix is developed and tested
4. A security advisory is published alongside the fix
5. Credit is given to the reporter (unless anonymity is requested)

## Security Best Practices for Users

- Keep your IntlParty packages up to date
- Use `pnpm audit` or `npm audit` regularly to check for known vulnerabilities in dependencies
- Never commit translation files containing secrets or sensitive data
