import { useToast } from 'vue-toastification'

export function useNotify() {
  const toast = useToast()
  return {
    success: (msg: string) => toast.success(msg),
    error: (msg: string) => toast.error(msg),
    info: (msg: string) => toast.info(msg),
    warning: (msg: string) => toast.warning(msg),
  }
}
