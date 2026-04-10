"use client";

export function FloatingLoadingModal({
  message,
  submessage,
}: {
  message: string;
  submessage?: string;
}) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-900/55 p-4 backdrop-blur-[2px]"
      role="status"
      aria-live="polite"
    >
      <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white px-8 py-10 text-center shadow-2xl dark:border-zinc-700 dark:bg-zinc-900">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-[3px] border-teal-200 border-t-teal-600 dark:border-teal-900 dark:border-t-teal-400" />
        <p className="mt-6 text-[17px] font-semibold text-zinc-900 dark:text-zinc-50">
          {message}
        </p>
        {submessage && (
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">{submessage}</p>
        )}
      </div>
    </div>
  );
}
