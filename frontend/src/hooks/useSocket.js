import { useEffect, useState } from 'react';
import { getSocket } from '../services/socketService';

export function useSocket() {
  const [socket, setSocket] = useState(getSocket());

  useEffect(() => {
    const interval = setInterval(() => {
      const currentSocket = getSocket();
      setSocket((previousSocket) => (previousSocket === currentSocket ? previousSocket : currentSocket));
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return socket;
}
