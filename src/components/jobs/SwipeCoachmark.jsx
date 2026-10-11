import { X, ArrowRight, ArrowLeft, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "apply_once_swipe_tutorial_seen";

export function hasSeenSwipeTutorial() {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

export function markSwipeTutorialSeen() {
  try {
    sessionStorage.setItem(STORAGE_KEY, "true");
  } catch {}
}

export default function SwipeCoachmark({ onDismiss }) {
  const handleDismiss = () => {
    markSwipeTutorialSeen();
    onDismiss?.();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-5 animate-fade-in"
      onClick={handleDismiss}
    >
      <div
        className="bg-card rounded-3xl border border-border shadow-xl max-w-sm w-full p-6 space-y-5 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
          aria-label="Close tutorial"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="text-center">
          <h2 className="text-xl font-bold text-foreground">Swipe to explore jobs</h2>
          <p className="text-sm text-muted-foreground mt-1">Find your next opportunity fast.</p>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-accent">
            <ArrowRight className="w-6 h-6 text-primary flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">Swipe right to apply</p>
              <p className="text-xs text-muted-foreground">Start preparing your application</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-accent">
            <ArrowLeft className="w-6 h-6 text-muted-foreground flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">Swipe left to dismiss</p>
              <p className="text-xs text-muted-foreground">Skip jobs you're not interested in</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-accent">
            <Bookmark className="w-6 h-6 text-warning flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">Tap bookmark to save</p>
              <p className="text-xs text-muted-foreground">Come back to it later</p>
            </div>
          </div>
        </div>
        <Button onClick={handleDismiss} className="w-full h-12 text-base font-semibold">
          Got it
        </Button>
      </div>
    </div>
  );
}