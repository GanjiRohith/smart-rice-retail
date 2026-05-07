export default function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50/50 backdrop-blur-sm">
      <div className="w-12 h-12 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
      <p className="mt-4 text-sm font-medium text-slate-500 tracking-wide animate-pulse">
        Loading...
      </p>
    </div>
  );
}