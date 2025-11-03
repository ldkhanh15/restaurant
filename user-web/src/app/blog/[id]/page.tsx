import BlogDetailPage from "@/components/blog-detail-page";

export const metadata = {
  title: "Chi Tiết Blog - HIWELL",
  description: "Xem chi tiết bài viết blog",
};

export default function BlogDetailPageRoute({
  params,
}: {
  params: { id: string };
}) {
  return <BlogDetailPage postId={params.id} />;
}
