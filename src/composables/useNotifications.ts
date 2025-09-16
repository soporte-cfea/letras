import { ref } from 'vue'

export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  duration?: number
}

const notifications = ref<Notification[]>([])

export function useNotifications() {
  const addNotification = (notification: Omit<Notification, 'id'>) => {
    const id = Date.now().toString()
    const newNotification: Notification = {
      id,
      duration: 5000,
      ...notification
    }
    
    notifications.value.push(newNotification)
    
    // Auto remove after duration
    if (newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(id)
      }, newNotification.duration)
    }
    
    return id
  }
  
  const removeNotification = (id: string) => {
    const index = notifications.value.findIndex(n => n.id === id)
    if (index > -1) {
      notifications.value.splice(index, 1)
    }
  }
  
  const clearAll = () => {
    notifications.value = []
  }
  
  // Helper functions for common notification types
  const success = (title: string, message: string, duration = 5000) => {
    return addNotification({ type: 'success', title, message, duration })
  }
  
  const error = (title: string, message: string, duration = 7000) => {
    return addNotification({ type: 'error', title, message, duration })
  }
  
  const warning = (title: string, message: string, duration = 6000) => {
    return addNotification({ type: 'warning', title, message, duration })
  }
  
  const info = (title: string, message: string, duration = 5000) => {
    return addNotification({ type: 'info', title, message, duration })
  }
  
  return {
    notifications,
    addNotification,
    removeNotification,
    clearAll,
    success,
    error,
    warning,
    info
  }
}
