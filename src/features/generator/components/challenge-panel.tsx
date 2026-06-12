import { ShieldAlertIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";

interface ChallengePanelProps {
  retryAfterSeconds?: number;
  turnstileSiteKey?: string;
}

export function ChallengePanel({
  retryAfterSeconds,
  turnstileSiteKey,
}: ChallengePanelProps) {
  return (
    <Alert variant="destructive">
      <ShieldAlertIcon />
      <AlertTitle>Verifikasi Diperlukan</AlertTitle>
      <AlertDescription>
        {turnstileSiteKey
          ? "Permintaan ini memerlukan verifikasi sebelum data tambahan dapat dibuat."
          : "Pembuatan data dibatasi sementara untuk sesi ini."}
        {retryAfterSeconds ? ` Coba lagi dalam sekitar ${retryAfterSeconds} detik.` : null}
      </AlertDescription>
    </Alert>
  );
}
