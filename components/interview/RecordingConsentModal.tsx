import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ShieldCheck } from "lucide-react";

interface RecordingConsentModalProps {
  open: boolean;
  onConsent: () => void;
}

export function RecordingConsentModal({
  open,
  onConsent,
}: RecordingConsentModalProps) {
  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-green-600" />
            Session Recording Consent
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3 text-muted-foreground text-sm">
              <p>
                This interview session will be recorded using your <strong>camera</strong> and{" "}
                <strong>microphone</strong> for evaluation and proctoring purposes.
              </p>
              <p>
                The recording will be securely stored and reviewed only by the hiring
                administrators.
              </p>
              <p className="font-semibold text-foreground">
                Do you consent to being recorded?
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {/* We do not provide a "Cancel" button that closes the modal, 
              because consent is MANDATORY to proceed. User must agree to continue. */}
          <AlertDialogAction onClick={onConsent}>
            I Agree, Start Interview
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
