import 'dotenv/config';
import { startSocketServer } from '../lib/socket/socketServer.js';
import { startDailyDhakaMidnightClearScheduler } from '../lib/maintenance/dailyClearScheduler.js';

(async function start() {
  startDailyDhakaMidnightClearScheduler();

  // start socket server regardless of serial availability so clients can connect
  try {
    startSocketServer();
  } catch (e) {
    console.warn(
      'Socket server failed to start:',
      e && e.message ? e.message : e,
    );
  }
  try {
    // Dynamically import the serial port module. If native bindings are missing
    // (e.g. running under Bun or an incompatible Node), this will throw and
    // we'll catch it to avoid crashing the server process.
    await import('../lib/serial/serialPort.js');
    console.log('Serial listener loaded');
  } catch (err) {
    console.warn(
      'Serial listener not loaded:',
      err && err.message ? err.message : err,
    );
  }
})();
