import http from 'http';
import { Server } from 'socket.io';

let io;
let server;

const PORT = process.env.SOCKET_PORT ? Number(process.env.SOCKET_PORT) : 4000;

function startSocketServer() {
  if (io) return io;

  server = http.createServer();

  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log('Socket client connected', socket.id);

    socket.on('disconnect', () => {
      console.log('Socket client disconnected', socket.id);
    });
  });

  server.listen(PORT, () => {
    console.log(`Socket.IO server running on port ${PORT}`);
  });

  return io;
}

function emitData(payload) {
  if (!io) startSocketServer();
  io.emit('data', payload);
}

function emitStatus(status) {
  if (!io) startSocketServer();
  io.emit('status', status);
}

export { startSocketServer, emitData, emitStatus };
