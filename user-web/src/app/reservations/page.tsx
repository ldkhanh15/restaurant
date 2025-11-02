import ReservationWizard from "@/components/reservation/ReservationWizard";
import ReservationGuard from "@/components/reservation/ReservationGuard";

export default function ReservationsPage() {
  return (
    <ReservationGuard>
      <ReservationWizard />
    </ReservationGuard>
  );
}
