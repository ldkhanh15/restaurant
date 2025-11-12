"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Calendar,
  Clock,
  User,
  Share2,
  Search,
  BookOpen,
  ArrowRight,
  Sparkles,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { BlogPost } from "@/types/BlogPost";
import blogService from "@/services/blogService";

const categories = [
  { id: "all", name: "Tất Cả" },
  { id: "Công thức", name: "Công thức" },
  { id: "Thực đơn", name: "Thực đơn" },
  { id: "Hướng dẫn", name: "Hướng dẫn" },
  { id: "Tin tức", name: "Tin tức" },
];

// Pagination Controls Component
const PaginationControls = ({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) => {
  if (totalPages <= 1) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex items-center justify-center gap-4 mt-12"
    >
      {/* Previous Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="flex items-center gap-2 border-accent/20 hover:bg-accent/10 hover:border-accent disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ChevronLeft className="h-4 w-4" />
        Trang trước
      </Button>

      {/* Page Numbers */}
      <div className="flex items-center gap-2">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
          // Show first page, last page, current page and pages around current page
          const shouldShow =
            page === 1 ||
            page === totalPages ||
            Math.abs(page - currentPage) <= 1;

          if (!shouldShow && page === 2 && currentPage > 4) {
            return (
              <span key={page} className="text-muted-foreground">
                ...
              </span>
            );
          }

          if (
            !shouldShow &&
            page === totalPages - 1 &&
            currentPage < totalPages - 3
          ) {
            return (
              <span key={page} className="text-muted-foreground">
                ...
              </span>
            );
          }

          if (!shouldShow) return null;

          return (
            <Button
              key={page}
              variant={page === currentPage ? "default" : "outline"}
              size="sm"
              onClick={() => onPageChange(page)}
              className={
                page === currentPage
                  ? "bg-gradient-gold text-primary-foreground min-w-[40px]"
                  : "border-accent/20 hover:bg-accent/10 hover:border-accent min-w-[40px]"
              }
            >
              {page}
            </Button>
          );
        })}
      </div>

      {/* Next Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="flex items-center gap-2 border-accent/20 hover:bg-accent/10 hover:border-accent disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Trang sau
        <ChevronRight className="h-4 w-4" />
      </Button>
    </motion.div>
  );
};

// Reusable BlogCard Component
const BlogCard = ({
  post,
  index,
  variant = "default",
  onClick,
}: {
  post: BlogPost;
  index: number;
  variant?: "default" | "featured";
  onClick?: () => void;
}) => {
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      whileHover={{ y: -4 }}
      className="group cursor-pointer"
      onClick={onClick}
    >
      <Card className="overflow-hidden border-2 border-transparent hover:border-accent/30 transition-all duration-300 shadow-md hover:shadow-xl bg-card h-full flex flex-col">
        <div
          className={`relative overflow-hidden ${
            variant === "featured" ? "aspect-[16/9]" : "aspect-[4/3]"
          }`}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent z-10" />
          <img
            src={post.thumbnail_url || "/placeholder.svg"}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
          <div className="absolute top-4 left-4 z-20">
            <Badge className="bg-accent/20 text-accent border border-accent/30 backdrop-blur-sm">
              {post.category || "Chưa phân loại"}
            </Badge>
          </div>
          {variant === "featured" && (
            <div className="absolute top-4 right-4 z-20">
              <Badge className="bg-gradient-gold text-primary-foreground border-0 shadow-md">
                <Sparkles className="w-3 h-3 mr-1" />
                Nổi Bật
              </Badge>
            </div>
          )}
          <div className="absolute bottom-4 left-4 right-4 z-20">
            <h3
              className={`font-elegant text-primary-foreground font-bold mb-2 ${
                variant === "featured" ? "text-2xl md:text-3xl" : "text-xl"
              } line-clamp-2`}
            >
              {post.title}
            </h3>
            {variant === "featured" && post.meta_description && (
              <p className="text-white/90 text-sm line-clamp-2 font-serif">
                {post.meta_description}
              </p>
            )}
          </div>
        </div>
        {variant !== "featured" && (
          <CardHeader className="flex-1">
            <CardTitle className="font-elegant text-xl text-primary group-hover:text-accent transition-colors line-clamp-2">
              {post.title}
            </CardTitle>
            <CardDescription className="font-serif text-sm leading-relaxed line-clamp-2">
              {post.meta_description || "Không có mô tả"}
            </CardDescription>
          </CardHeader>
        )}
        <CardContent className={variant === "featured" ? "p-6" : ""}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <User className="h-4 w-4" />
                <span>
                  {post.author?.name ||
                    post.author?.full_name ||
                    post.author?.username ||
                    "Ẩn danh"}
                </span>
              </div>
              {post.published_at && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {format(new Date(post.published_at), "dd/MM/yyyy", {
                      locale: vi,
                    })}
                  </span>
                </div>
              )}
            </div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="outline"
                size="sm"
                className="border-accent/20 hover:bg-accent/10 hover:border-accent"
              >
                Đọc Thêm
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.article>
  );
};

export default function BlogSystem() {
  const router = useRouter();
  const [allBlogs, setAllBlogs] = useState<BlogPost[]>([]); // Store all blogs
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"published_at">("published_at");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Fetch all blogs for category counting (run once)
  const fetchAllBlogsForCounting = async () => {
    try {
      const response = await blogService.getAll({
        status: "published",
        limit: 10, // Get all for counting
      });
      const data = response.data?.data || response.data || [];
      setAllBlogs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching blogs for counting:", err);
      setAllBlogs([]);
    }
  };

  // Fetch all blogs once
  const fetchAllBlogs = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await blogService.getAll({
        status: "published",
        limit: 10, // Get all blogs
      });

      // Extract data from response
      const data = response.data?.data || response.data || [];
      setAllBlogs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching blogs:", err);
      setError(err instanceof Error ? err.message : "Không thể tải bài viết");
      setAllBlogs([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  // Initial load: fetch all blogs
  useEffect(() => {
    fetchAllBlogs();
    fetchAllBlogsForCounting();
  }, []);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, searchQuery]);

  // Client-side filtering based on search and category
  const filteredBlogs = useMemo(() => {
    let filtered = [...allBlogs];

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      filtered = filtered.filter((blog: BlogPost) =>
        blog.title?.toLowerCase().includes(query)
      );
    }

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter(
        (blog: BlogPost) => blog.category === selectedCategory
      );
    }

    // Filter by status
    filtered = filtered.filter((blog: BlogPost) => blog.status === "published");

    // Sort blogs by published_at (newest first)
    filtered.sort((a, b) => {
      if (!a.published_at || !b.published_at) return 0;
      return (
        new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
      );
    });

    return filtered;
  }, [allBlogs, searchQuery, selectedCategory, sortBy]);

  // Find featured post (most recent published post)
  const featuredPost = useMemo(() => {
    if (filteredBlogs.length === 0 || searchQuery ) return null;

    // Use the most recent published post as featured
    return filteredBlogs.reduce((latest: BlogPost, current: BlogPost) => {
      if (!latest.published_at) return current;
      if (!current.published_at) return latest;
      return new Date(current.published_at) > new Date(latest.published_at)
        ? current
        : latest;
    });
  }, [filteredBlogs]);

  // Separate featured and regular posts
  const regularBlogs = filteredBlogs.filter(
    (blog: BlogPost) => blog.id !== featuredPost?.id
  );

  // Pagination calculations
  const totalPages = Math.ceil(regularBlogs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedBlogs = regularBlogs.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const handlePostClick = (postId: string) => {
    console.log("Navigating to blog detail with postId:", postId);
    router.push(`/blog/${postId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-cream py-8 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-accent" />
          <p className="text-muted-foreground font-serif">
            Đang tải bài viết...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-cream py-8 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 mx-auto mb-4 text-destructive" />
          <p className="text-destructive font-serif mb-4">
            Không thể tải bài viết
          </p>
          <p className="text-muted-foreground text-sm mb-4">{error}</p>
          <div className="space-x-4">
            <Button
              onClick={() => {
                setError(null);
                fetchAllBlogs();
                fetchAllBlogsForCounting();
              }}
              className="mt-4"
            >
              Thử lại
            </Button>
            <Button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
                setError(null);
              }}
              variant="outline"
            >
              Đặt lại bộ lọc
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-cream py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-gold rounded-full flex items-center justify-center shadow-lg">
              <BookOpen className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-elegant text-4xl md:text-5xl font-bold text-primary">
                Blog Ẩm Thực
              </h1>
              <p className="text-muted-foreground font-serif italic">
                Khám phá những câu chuyện và bí quyết ẩm thực
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Tìm kiếm bài viết..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-accent/20 focus:border-accent"
              />
            </div>
          </div>

          {/* Category Pills */}
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => {
              const count =
                category.id === "all"
                  ? allBlogs.length
                  : allBlogs.filter((b) => b.category === category.id).length;

              return (
                <motion.div
                  key={category.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    variant={
                      selectedCategory === category.id ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => setSelectedCategory(category.id)}
                    className={
                      selectedCategory === category.id
                        ? "bg-gradient-gold text-primary-foreground"
                        : "border-accent/20"
                    }
                  >
                    {category.name} ({count})
                  </Button>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Featured Post Section */}
        {featuredPost && (
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-16"
          >
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="h-5 w-5 text-accent" />
              <h2 className="font-elegant text-2xl font-semibold text-primary">
                Bài Viết Nổi Bật
              </h2>
            </div>
            <BlogCard
              post={featuredPost}
              index={0}
              variant="featured"
              onClick={() => handlePostClick(featuredPost.id)}
            />
          </motion.section>
        )}

        {/* Regular Posts Grid */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h2 className="font-elegant text-2xl font-semibold text-primary mb-6">
            Tất Cả Bài Viết
            {regularBlogs.length > 0 && (
              <span className="text-sm text-muted-foreground font-normal ml-2">
                ({regularBlogs.length} bài viết)
              </span>
            )}
          </h2>
          {paginatedBlogs.length > 0 ? (
            <>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedBlogs.map((post, index) => (
                  <BlogCard
                    key={post.id}
                    post={post}
                    index={index}
                    variant="default"
                    onClick={() => handlePostClick(post.id)}
                  />
                ))}
              </div>

              {/* Pagination Controls */}
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </>
          ) : (
            <div className="text-center py-16">
              <BookOpen className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground font-serif">
                Không tìm thấy bài viết nào
              </p>
            </div>
          )}
        </motion.section>
      </div>
    </div>
  );
}
