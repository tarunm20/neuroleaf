interface LoadingPageProps {
  message?: string;
  showCards?: boolean;
}

export function LoadingPage({ 
  message = "Loading...", 
  showCards = false 
}: LoadingPageProps) {
  return (
    <div className="space-y-8 py-8">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4" />
        <p className="text-emerald-600">{message}</p>
      </div>
      
      {showCards && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 bg-gradient-to-br from-emerald-50 to-emerald-100 animate-pulse rounded-lg border border-emerald-100" />
          ))}
        </div>
      )}
    </div>
  );
}