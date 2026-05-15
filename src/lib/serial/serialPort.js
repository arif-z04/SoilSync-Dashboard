import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';

import { parsePacket } from './parser.js';
import { validatePacket } from './validator.js';

import { setLatestData, setLatestDataLocal } from '../store/latestData.js';
import { addHistory } from '../store/historyStore.js';
import { addLog } from '../store/logsStore.js';
import {
  startSocketServer,
  emitData,
  emitStatus,
} from '../socket/socketServer.js';
import { pushPacket } from '../db/bufferFlusher.js';

const portPath = process.env.SERIAL_PORT || '/dev/ttyUSB0';

const port = new SerialPort({
  path: portPath,
  baudRate: 9600,
});

const parser = port.pipe(
  new ReadlineParser({
    delimiter: '\n',
  }),
);

port.on('open', () => {
  console.log('Serial Connected');

  addLog('INFO', 'Serial Port Connected');
  emitStatus({ connected: true });
});

port.on('close', () => {
  console.log('Serial Disconnected');

  addLog('ERROR', 'Serial Port Disconnected');
  emitStatus({ connected: false });
});

port.on('error', (err) => {
  console.log(err.message);

  addLog('ERROR', err.message);
  emitStatus({ connected: false, error: err.message });
});

parser.on('data', (line) => {
  console.log('RAW:', line);

  const packet = parsePacket(line);

  if (!validatePacket(packet)) {
    console.log('Invalid Packet');

    addLog('ERROR', 'Invalid Packet Received');

    return;
  }

  // mark server receive time so UI can show "Posted" immediately
  packet.serverReceivedAt = new Date().toISOString();
  setLatestDataLocal(packet);

  // push packet to buffer; bufferFlush will persist to Mongo every 10s
  pushPacket(packet);

  // Broadcast live packet updates so the UI can update history immediately.
  emitData(packet);

  // Log reception (persisted by flusher later)
  try {
    addLog('DATA', 'Valid Packet Received');
  } catch (e) {
    console.error('Log enqueue failed', e && e.message ? e.message : e);
  }

  console.log('Buffered packet:', packet);
});
