import { toast as sonnerToast } from "sonner";

interface ToastPromiseMessages {
  loading: string;
  success: string;
  error: string;
}

function backendMessage(error: unknown): string | null {
  const candidate = error as {
    response?: { data?: { error?: { message?: string } } };
  };
  const message = candidate?.response?.data?.error?.message;
  return typeof message === "string" && message !== "" ? message : null;
}

export const toast = {
  success: (message: string) => sonnerToast.success(message),
  error: (message: string) => sonnerToast.error(message),
  loading: (message: string) => sonnerToast.loading(message),
  promise: <T>(
    promise: Promise<T>,
    messages: ToastPromiseMessages,
  ): Promise<T> => {
    sonnerToast.promise(promise, {
      loading: messages.loading,
      success: messages.success,
      error: (error: unknown) => {
        const detail = backendMessage(error);
        return detail === null
          ? messages.error
          : `${messages.error} — ${detail}`;
      },
    });
    return promise;
  },
};
