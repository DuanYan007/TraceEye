import { ref, onUnmounted } from 'vue'

export function useWebSocket() {
  const ws = ref<WebSocket | null>(null)
  const reconnectAttempts = ref(0)
  const maxReconnectAttempts = 5
  const reconnectInterval = 3000

  const messageHandlers = new Set<(data: any) => void>()
  const isConnected = ref(false)

  const connect = (url: string) => {
    if (ws.value?.readyState === WebSocket.OPEN) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      const wsUrl = `${url}?token=${token}`

      ws.value = new WebSocket(wsUrl)

      ws.value.onopen = () => {
        console.log('WebSocket连接已建立')
        isConnected.value = true
        reconnectAttempts.value = 0
      }

      ws.value.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          messageHandlers.forEach(handler => handler(data))
        } catch (error) {
          console.error('解析WebSocket消息失败:', error)
        }
      }

      ws.value.onclose = () => {
        console.log('WebSocket连接已关闭')
        isConnected.value = false

        // 自动重连
        if (reconnectAttempts.value < maxReconnectAttempts) {
          setTimeout(() => {
            reconnectAttempts.value++
            console.log(`尝试重连第${reconnectAttempts.value}次`)
            connect(url)
          }, reconnectInterval)
        }
      }

      ws.value.onerror = (error) => {
        console.error('WebSocket错误:', error)
      }

    } catch (error) {
      console.error('创建WebSocket连接失败:', error)
    }
  }

  const disconnect = () => {
    if (ws.value) {
      ws.value.close()
      ws.value = null
    }
    isConnected.value = false
    messageHandlers.clear()
  }

  const send = (data: any) => {
    if (ws.value?.readyState === WebSocket.OPEN) {
      ws.value.send(JSON.stringify(data))
    } else {
      console.warn('WebSocket未连接，无法发送消息')
    }
  }

  const onMessage = (handler: (data: any) => void) => {
    messageHandlers.add(handler)

    // 返回取消订阅函数
    return () => {
      messageHandlers.delete(handler)
    }
  }

  const removeMessageHandler = (handler: (data: any) => void) => {
    messageHandlers.delete(handler)
  }

  onUnmounted(() => {
    disconnect()
  })

  return {
    connect,
    disconnect,
    send,
    onMessage,
    removeMessageHandler,
    isConnected: isConnected.value
  }
}