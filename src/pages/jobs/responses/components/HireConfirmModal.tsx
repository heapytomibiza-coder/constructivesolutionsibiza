/**
 * HireConfirmModal — high-commitment confirmation for accept_response.
 *
 * Restates name, price, consequences, and is the only path to accept_response
 * from the client UI.
 */

import { useTranslation } from "react-i18next";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Props {
  open: boolean;
  proName: string;
  priceLabel: string;
  otherProsCount: number;
  isSubmitting?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function HireConfirmModal({
  open,
  proName,
  priceLabel,
  otherProsCount,
  isSubmitting,
  onConfirm,
  onCancel,
}: Props) {
  const { t } = useTranslation("responses");

  return (
    <AlertDialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t("hireModal.title", { name: proName, price: priceLabel })}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p className="font-medium text-foreground">{t("hireModal.willHappen")}</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>{t("hireModal.openWorkspace")}</li>
                <li>{t("hireModal.initiatePayment")}</li>
                {otherProsCount > 0 && (
                  <li>{t("hireModal.declineOthers", { count: otherProsCount })}</li>
                )}
              </ul>
              <p className="text-xs text-muted-foreground pt-2 border-t">
                {t("hireModal.irreversible")}
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmitting}>
            {t("hireModal.cancel")}
          </AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isSubmitting}>
            {isSubmitting
              ? t("hireModal.submitting")
              : t("hireModal.confirm", { name: proName })}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
