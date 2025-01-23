import io from 'socket.io-client';

const socket = io('YOUR_BACKEND_SOCKET_URL', {
  auth: {
    token: 'USER_AUTH_TOKEN'
  }
});

export default socket;