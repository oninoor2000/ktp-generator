import { useState, useEffect } from "react";
import { Badge } from "./ui/badge";
import { checkBackendStatus } from "@/service/data-generation-service";

export function DataGenerationStatus() {
  const [backendStatus, setBackendStatus] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      setIsLoading(true);
      try {
        const isBackendAvailable = await checkBackendStatus();
        setBackendStatus(isBackendAvailable);
      } catch (error) {
        console.error("Error checking backend status:", error);
        setBackendStatus(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkStatus();

    // Check status every 30 seconds
    const interval = setInterval(checkStatus, 30000);

    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="text-muted-foreground flex items-center gap-2 text-sm">
        <div className="h-2 w-2 animate-pulse rounded-full bg-gray-400" />
        Checking API status...
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Badge
        variant={backendStatus ? "default" : "destructive"}
        className="flex items-center gap-1.5"
      >
        <div
          className={`h-2 w-2 rounded-full ${
            backendStatus ? "animate-pulse bg-green-400" : "bg-red-400"
          }`}
        />
        Backend API
      </Badge>

      <span className="text-muted-foreground text-xs">
        {backendStatus ? "Connected" : "Disconnected - Check backend server"}
      </span>
    </div>
  );
}
