import { toast } from 'vue-sonner'

export const useToast = () => {
  const success = (message: string) => {
    toast.success(message)
  }

  const error = (message: string) => {
    toast.error(message)
  }

  const warning = (message: string) => {
    toast.warning(message)
  }

  return { success, error, warning }
}
