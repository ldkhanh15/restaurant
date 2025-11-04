import EventDetailPage from "@/components/event-detail-page";

export const metadata = {
  title: "Chi Tiết Sự Kiện - HIWELL",
  description: "Xem chi tiết sự kiện",
};

export default function EventDetailPageRoute({
  params,
}: {
  params: { id: string };
}) {
  return <EventDetailPage />;
}
