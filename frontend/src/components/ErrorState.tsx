import { getApiErrorMessage } from "../api/axios";
import { Button } from "./ui/Button";

interface ErrorStateProps {
  message?: string;
  error?: unknown;
  onRetry: () => void;
}

export function ErrorState({ message, error, onRetry }: ErrorStateProps) {
  return (
    <div
      className="flex flex-col items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-8 text-center"
      role="alert"
    >
      <p className="text-sm font-medium text-red-700">
        {message ?? "تعذّر جلب البيانات"}
      </p>
      {error !== undefined ? (
        <p className="text-xs text-red-600">{getApiErrorMessage(error)}</p>
      ) : null}
      <Button variant="secondary" onClick={onRetry} className="px-3 py-1.5 text-xs">
        إعادة المحاولة
      </Button>
    </div>
  );
}