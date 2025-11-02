import TableDetailPage from "@/components/table-detail-page";

export const metadata = {
  title: "Chi Tiết Bàn - HIWELL",
  description: "Xem chi tiết bàn ăn",
};

export default function TableDetailPageRoute({
  params,
}: {
  params: { id: string };
}) {
  return <TableDetailPage />;
}
