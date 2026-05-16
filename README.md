# SoilSync Dashboard

>A lightweight dashboard for monitoring soil, battery, and solar data from Arduino sensors.

This repository contains a Next.js dashboard and a small Node-based server that listens to a serial-connected Arduino, buffers incoming sensor packets, persists them to MongoDB, and broadcasts live updates to connected clients via WebSockets.

## Features

- Live charts and tables of sensor data
- WebSocket-based live updates for responsive UI
- Serial listener for Arduino sensor packets (optional)
- Buffered writes to MongoDB for reliability
- Simple REST API endpoints for latest data, history, and logs

## Quickstart

Prerequisites:

- Node.js 18+ and npm
- (Optional) MongoDB instance if you want persistent storage
- (Optional) A serial-connected Arduino device

Install dependencies:

```bash
npm install
```

Run the Next.js development server:

```bash
npm run dev
```

Start the serial/socket server (loads WebSocket server and optionally the serial listener):

```bash
npm run serial
```

The `serial` script runs `node src/server/startSerial.js`, which will:

- Start a WebSocket server so clients can receive live updates
- Attempt to dynamically load the serial listener (safe if native bindings are missing)
- Start a scheduled daily maintenance task

Open http://localhost:3000 in your browser to view the dashboard.

## Environment variables

Create a `.env.local` file at the project root or export these variables in your environment:

- `MONGODB_URI` — MongoDB connection string (optional; if omitted, data persists in memory only)
- `SERIAL_PORT` — Path to the serial device (defaults to `/dev/ttyUSB0`)
- `PORT` — Port for Next.js / server (defaults to `3000`)

Example `.env.local`:

```
MONGODB_URI=mongodb://localhost:27017/soilsync
SERIAL_PORT=/dev/ttyUSB0
PORT=3000
```

## API Endpoints

This project exposes a few simple endpoints under `src/pages/api`:

- `GET /api/latest` — current/latest sensor reading
- `GET /api/history` — historical sensor data
- `GET /api/logs` — application logs
- `POST /api/admin/clear-all` — admin endpoint to clear data (use with caution)

Refer to the files in `src/pages/api/` for implementation details.

## Project Structure (high level)

- `src/app/` — Next.js app and pages
- `src/lib/serial/` — serial parser, validator, and port handling
- `src/lib/db/` — Mongo buffer flusher and DB helpers
- `src/lib/socket/` — WebSocket server and emit helpers
- `src/server/startSerial.js` — boots the socket server, maintenance scheduler, and attempts to load serial listener

## Notes & Troubleshooting

- Serial defaults: `SERIAL_PORT=/dev/ttyUSB0`, baud rate `9600` (configured in `src/lib/serial/serialPort.js`).
- If `serialport` native bindings fail to load (e.g., incompatible runtime), the server will still start without serial support.
- Check the logs in the browser console and the server terminal for `Serial Connected`, `Buffered packet`, and other status messages.

## Scripts

Key npm scripts (from `package.json`):

- `npm run dev` — start Next.js in development
- `npm run build` — build production assets
- `npm run start` — start Next.js in production mode
- `npm run serial` — run `src/server/startSerial.js` (starts socket + optionally serial listener)

## Contributing

Feel free to open issues or PRs. For changes involving serial parsing or packet formats, include sample packets and tests where possible.

## License

This project is provided as-is. Add a license file (`LICENSE`) if you plan to publish.
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
