import { Spinner } from "./Spinner";
import { SPACER_PY_LOADING_CLASS } from "../lib/ui";

interface LoadingStateProps {
  message?: string;
}

/** Page-level loading state: one spinner, one message, one vertical rhythm. */
export function LoadingState({ message = "جارٍ التحميل…" }: LoadingStateProps) {
  return (
    <div className={`${SPACER_PY_LOADING_CLASS} text-sm text-gray-500`} role="status">
      <Spinner className="h-6 w-6 text-indigo-600" />
      {message}
    </div>
  );
}
