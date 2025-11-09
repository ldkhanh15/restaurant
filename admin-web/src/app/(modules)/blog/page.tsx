import { BlogManagement } from "@/components/modules/blog-management"

// Force dynamic rendering to avoid build errors with react-quill
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function Page() {
    return <BlogManagement />
}


