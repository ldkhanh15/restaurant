import TableListing from "@/components/table-listing";

export const metadata = {
  title: "Bàn Ăn - HIWELL",
  description: "Xem danh sách và chọn bàn ăn phù hợp",
};

// Disable static generation for this page to avoid build errors
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function TablesPage() {
  return <TableListing />;
}
