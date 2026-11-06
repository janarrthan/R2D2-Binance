# R2D2 – Binance

A Node.js trading bot that copies crypto futures signals from Telegram to Binance. It listens to Telegram channels, parses each signal message (direction, coin, entry, targets and stop loss) using rules you set per channel, and opens trades on **Binance USDⓈ-M Futures** for several user accounts at once. A web dashboard lets you manage users, channels, strategies, signals, orders and price alerts.

> ⚠️ **Disclaimer:** This software places real orders with real money. Use it at your own risk. Test with small amounts first. The authors are not responsible for any financial loss.

---

## Features

- **Telegram signal listener**: connects one or more Telegram user accounts (via [mtcute](https://mtcute.dev) / [GramJS](https://gram.js.org)) and watches the channels you choose.
- **Configurable signal extraction**: for each channel you set keywords and parsing rules for:
  - direction (Long/Short keywords)
  - coin name (remove/replace keywords, price multiplier)
  - entry price
  - targets (on one line or on separate lines)
  - stop loss
  - include/exclude filters, and an alert when only part of a signal could be read
- **Duplicate and repeat detection**: duplicate signals are ignored and repeated signals are flagged.
- **Strategies**: per channel and per direction:
  - main types: `NTS`, `OTS`, `PENTS` (percentage entry)
  - sub-types: `normal`, `stopLossMoveToEntry`, `tpEntry`
  - pick which target to use for the take profit, entry, stop loss and cancel level
  - exclude days or dates, and skip repeated trades
- **Multi-user auto-trading**: places orders for every active user with their own Binance API key, then sets take profit and stop loss automatically once the entry fills.
- **Trade monitoring loop** (every 1 second, using the Binance futures ticker websocket):
  - entry fill detection
  - take profit and stop loss hits
  - moving the stop loss to entry
  - cancelling a trade if the price reaches the target before the entry fills
- **Telegram replies**: posts the trade's result (profit hit, stop loss hit, closed at entry, cancelled) to a reply channel.
- **Candle sanity check** (every 5 minutes): compares 1h candles against active signals and raises an alert if a level was crossed but the trade is still open.
- **Price alerts**: up/down price alerts on any futures symbol.
- **User management**: see a user's live positions, open orders and algo/TP-SL orders, and close them from the dashboard.
- **Notifications**: app errors and alerts are stored in a separate MongoDB database and can be emailed through Brevo SMTP.
- **Security basics**: hashed admin login, session auth, rate limiting on `/api/*`, automatic IP blocking after 3 failed logins, and an email alert when someone logs in from a new device.

## Tech Stack

| Layer         | Technology                                                      |
| ------------- | --------------------------------------------------------------- |
| Runtime       | Node.js (ES Modules)                                            |
| Web server    | Express 5, express-session, express-rate-limit, express-ipfilter |
| Views         | Handlebars (`express-handlebars`), Bootstrap, jQuery, DataTables |
| Database      | MongoDB via Mongoose                                            |
| Exchange      | `binance-api-node` + signed REST calls (`axios`)                |
| Telegram      | `@mtcute/node`, `@mtcute/dispatcher`, `telegram` (GramJS)       |
| Email         | Nodemailer (Brevo SMTP relay)                                   |

> Bybit adapters (`src/exchanges/bybit/`) are also included, but this build trades on Binance.

## Project Structure

```
.
├── public/                 # Static assets (CSS, client-side JS per page, alert sound)
├── views/                  # Handlebars pages + layouts
├── src/
│   ├── app.js              # Entry point: Express app, middleware, routes, starts auto-trading
│   ├── auto-trading.js     # Telegram startup + price/TP/SL monitoring loops
│   ├── cron-job.js         # Seed admin user / time keeper, notification broadcaster
│   ├── alerts/             # Price alert logic
│   ├── binance/            # Binance price/instrument helpers
│   ├── controllers/        # DB/business logic per entity
│   ├── db/mongoose.js      # MongoDB connection
│   ├── exchanges/
│   │   ├── binance/        # Account + trade execution (Binance Futures)
│   │   └── bybit/          # Bybit equivalents
│   ├── middleware/         # Session auth for pages and API
│   ├── models/             # Mongoose schemas
│   ├── routers/            # Page + REST API routes
│   ├── telegram/           # Telegram clients, message handler, signal extractor/convertor
│   └── utils/              # Errors, email, formatting, P/L calculation, alert sound
├── .env.example
└── package.json
```

## Getting Started

### Prerequisites

- **Node.js 20+**
- **MongoDB**: local or Atlas. The app uses two databases, one for app data and one for notifications.
- A **Telegram API ID and API hash** for each listener account, from <https://my.telegram.org>
- **Binance Futures API keys** for each trading user. Enable Futures and restrict the keys to your server's IP.
- *(Optional)* A **Brevo** SMTP account for email notifications

### Installation

```bash
git clone https://github.com/<your-username>/<your-repo>.git
cd <your-repo>
npm install
cp .env.example .env    # then fill in your values
```

### Environment Variables

| Variable                  | Description                                                        |
| ------------------------- | ------------------------------------------------------------------ |
| `ENVIRONMENT`             | `dev` turns on audible alerts and verbose error logging             |
| `PORT`                    | HTTP port for the dashboard                                        |
| `SESSION_SECRET`          | Secret used to sign session cookies                                |
| `LOCAL_DB`                | MongoDB connection string for app data                              |
| `NOTIF_DB`                | MongoDB connection string for notifications                         |
| `SMTP_KEY`                | Brevo SMTP key                                                     |
| `BREVO_AUTH`              | Brevo SMTP login                                                   |
| `BREVO_EMAIL`             | "From" address for outgoing emails                                 |
| `BREVO_RECEIVER_EMAIL`    | Address that receives login and alert emails                        |
| `AUTH_EMAIL`              | Email of the initial dashboard admin                               |
| `AUTH_PASSWORD`           | Password of the initial dashboard admin                            |

### First Run

1. **Start the app:**
   ```bash
   npm start          # runs nodemon src/app.js
   ```
2. **Admin user is seeded automatically.** On startup, the app creates the dashboard login from `AUTH_EMAIL`/`AUTH_PASSWORD` and the time-keeper record if they don't exist yet. If they already exist, it does nothing.
3. **Log in to Telegram.** The first time a Telegram account connects, you'll be asked in the terminal for its phone number, login code and (if set) 2FA password. The session is then saved locally (`MCute<accountId>` and a `<accountId>/` folder). These files are git-ignored and **must never be committed**.
4. Open `http://localhost:<PORT>` and log in.

### Typical Setup Flow

1. **Telegram Accounts**: add your listener account(s) with their API ID and hash.
2. **Channels**: add each signal channel, the reply channel and which account posts replies.
3. **Channel Settings**: set up parsing rules for the channel's message format.
4. **Strategies**: set how targets, entry and stop loss are chosen for Long and Short signals.
5. **Users**: add trading users with their Binance API key, secret and the strategies they follow.
6. Watch **Telegram Signals**, **Signals**, **Orders** and **Notifications** as trades come in.

## Dashboard Pages

| Route                 | Purpose                                           |
| --------------------- | ------------------------------------------------- |
| `/`                   | Login                                             |
| `/users`              | Manage trading users and their API keys           |
| `/user-management/:id`| Live positions and orders for one user            |
| `/signals`            | Active bot signals being tracked                  |
| `/telegram-signals`   | Raw signals parsed from Telegram                  |
| `/orders/:signalId`   | Orders placed for a signal                        |
| `/channels`           | Signal channels                                   |
| `/channels/settings/:id` | Parsing rules for a channel                    |
| `/telegram-accounts`  | Telegram listener accounts                        |
| `/strategies`         | Trading strategies                                |
| `/price-alerts`       | Price alerts                                      |
| `/notifications`      | App errors and alerts                             |

Each page has a matching REST API under `/api/...`. All API routes need a logged-in session and are rate limited to 100 requests per hour per IP.

## Security Notes

- **Never commit `.env` or Telegram session files.** Anyone with a session file can log in to that Telegram account.
- Users' exchange API keys are stored in MongoDB. Keep the database private and restrict access to it.
- On Binance, enable **IP whitelisting** and **never enable withdrawals** on the API keys.
- Use a long random `SESSION_SECRET` and run the dashboard behind HTTPS in production.

## License

ISC
