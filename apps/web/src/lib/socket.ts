import { io, type Socket } from 'socket.io-client'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
const SOCKET_URL = API_BASE.replace(/\/api\/?$/, '')

let socket: Socket | null = null

export const connectMessagingSocket = (): Socket => {
  const token = localStorage.getItem('accessToken')

  if (socket) {
    socket.auth = { token }
    if (!socket.connected) socket.connect()
    return socket
  }

  socket = io(`${SOCKET_URL}/messaging`, {
    auth: { token },
    withCredentials: true,
  })
  return socket
}

export const disconnectMessagingSocket = () => {
  socket?.disconnect()
  socket = null
}

export const getMessagingSocket = () => socket
