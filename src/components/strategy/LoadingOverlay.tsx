interface LoadingOverlayProps {
  message: string;
}

export function LoadingOverlay({ message }: LoadingOverlayProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-card rounded-lg p-8 shadow-lg text-center max-w-sm mx-4">
        <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-foreground">{message}</p>
      </div>
    </div>
  );
}
