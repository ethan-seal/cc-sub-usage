# cc-sub-usage

A tiny TypeScript CLI to check your Claude Code subscription usage directly from the terminal.

## Features

- **Real-time quota info** - See your 5-hour and 7-day usage limits
- **Uses local credentials** - Reads OAuth token from Claude Code's config (no extra login needed)
- **Watch mode** - Auto-refresh to monitor usage over time
- **JSON output** - Pipe to other tools or scripts

## Example Output

```
⚠ Token expires in 7h

Claude Code Usage (max plan)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
5-Hour Quota     █████████░░░░░░░░░░░  45%  resets in 3h 9m
7-Day Overall    ██░░░░░░░░░░░░░░░░░░   9%  resets in 6d 3h
7-Day Sonnet     █░░░░░░░░░░░░░░░░░░░   3%  resets in 3d 7h
```

## Prerequisites

- Node.js 18+
- Claude Code installed and logged in (run `/login` in Claude Code first)

## Installation

```bash
git clone https://github.com/yourusername/cc-sub-usage
cd cc-sub-usage
npm install
npm run build
```

### Global install (optional)

```bash
npm link
# Now you can run `cc-usage` from anywhere
```

## Usage

```bash
# Show current usage (pretty output)
npm start

# JSON output
npm start -- --json

# Watch mode - auto-refresh every 30 seconds
npm start -- --watch

# Custom refresh interval (e.g., every 10 seconds)
npm start -- --watch 10
```

Or if globally installed:

```bash
cc-usage
cc-usage --json
cc-usage --watch
```

## How it works

Claude Code stores OAuth credentials at `~/.claude/.credentials.json`. This CLI reads the access token and calls the same API endpoint that Claude Code uses internally:

```
GET https://api.anthropic.com/api/oauth/usage
Authorization: Bearer <token>
anthropic-beta: oauth-2025-04-20
```

No additional authentication or API keys required!

## API Response

The `/api/oauth/usage` endpoint returns:

```json
{
  "five_hour": {
    "utilization": 45,
    "resets_at": "2026-01-31T21:00:00+00:00"
  },
  "seven_day": {
    "utilization": 9,
    "resets_at": "2026-02-06T21:00:00+00:00"
  },
  "seven_day_sonnet": {
    "utilization": 3,
    "resets_at": "2026-02-04T01:00:00+00:00"
  },
  "seven_day_opus": null,
  "extra_usage": {
    "is_enabled": false,
    "monthly_limit": null,
    "used_credits": null,
    "utilization": null
  }
}
```

## License

MIT
