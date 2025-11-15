"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  Clock,
  User,
  Share2,
  ArrowLeft,
  BookOpen,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { BlogPost } from "@/type/BlogPost";
import blogService from "@/services/blogService";

interface BlogDetailPageProps {
  postId: string;
}

export default function BlogDetailPage({ postId }: BlogDetailPageProps) {
  const router = useRouter();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  console.log("BlogDetailPage rendered with postId:", postId);

  // Fetch blog post from API
  const fetchPost = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await blogService.getById(postId);
      const data = response.data?.data || response.data;
      
      if (!data) {
        setError("Không tìm thấy bài viết");
        return;
      }
      
      setPost(data);
    } catch (err) {
      console.error('Error fetching blog post:', err);
      setError(err instanceof Error ? err.message : 'Không thể tải bài viết');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (postId) {
      fetchPost();
    }
  }, [postId]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-cream flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-accent" />
          <p className="text-muted-foreground font-serif">Đang tải bài viết...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !post) {
    return (
      <div className="min-h-screen bg-gradient-cream flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
          <p className="text-destructive font-serif mb-4">
            {error || "Không tìm thấy bài viết"}
          </p>
          <div className="space-x-4">
            <Button onClick={fetchPost} variant="outline">
              Thử lại
            </Button>
            <Button onClick={() => router.push("/blog")}>
              Quay Lại Blog
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-cream">
      {/* Header */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="border-b border-accent/20 bg-card/95 backdrop-blur-sm sticky top-0 z-50"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button
              onClick={() => router.push("/blog")}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <BookOpen className="h-6 w-6 text-accent" />
              <span className="font-elegant text-lg font-semibold text-primary">
                Blog Ẩm Thực
              </span>
            </button>
            <Button
              variant="outline"
              onClick={() => router.push("/blog")}
              className="border-accent/20 hover:bg-accent/10"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Quay Lại
            </Button>
          </div>
        </div>
      </motion.nav>

      <article className="max-w-4xl mx-auto px-4 py-12">
        {/* Article Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <Badge className="mb-6 bg-accent/10 text-accent border border-accent/20">
            {post.category}
          </Badge>
          <h1 className="font-elegant text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-primary leading-tight">
            {post.title}
          </h1>
          {post.meta_description && (
            <p className="font-serif text-xl text-muted-foreground mb-8 leading-relaxed">
              {post.meta_description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-6 text-muted-foreground mb-8">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5" />
              <span className="font-medium">
                {post.author?.name || post.author?.full_name || post.author?.username || "Ẩn danh"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              <span>
                {post.published_at 
                  ? format(new Date(post.published_at), "EEEE, dd MMMM yyyy", { locale: vi })
                  : "Chưa xuất bản"
                }
              </span>
            </div>
            {/* Remove read time as it's not in BlogPost type */}
          </div>

          <Separator className="mb-8" />

          <div className="flex items-center justify-end">
            <Button
              variant="outline"
              size="sm"
              className="border-accent/20 hover:bg-accent/10"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Chia Sẻ
            </Button>
          </div>
        </motion.div>

        {/* Featured Image */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative aspect-[16/9] overflow-hidden rounded-lg mb-12"
        >
          <img
            src={post.thumbnail_url || "/placeholder.svg"}
            alt={post.title}
            className="w-full h-full object-cover"
          />
        </motion.div>

        {/* Article Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="prose prose-lg max-w-none"
        >
          <div
            className="font-serif text-lg leading-relaxed text-foreground space-y-8"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </motion.div>

        {/* Tags - Only show if category exists */}
        {post.category && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mt-12 pt-8 border-t border-accent/20"
          >
            <div className="flex flex-wrap gap-2 mb-8">
              <Badge
                variant="secondary"
                className="bg-accent/5 text-accent border-accent/20"
              >
                #{post.category}
              </Badge>
            </div>
          </motion.div>
        )}

        {/* Back to Blog Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-8 text-center"
        >
          <Button
            onClick={() => router.push("/blog")}
            variant="outline"
            size="lg"
            className="border-accent/20 hover:bg-accent/10"
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            Quay Lại Blog
          </Button>
        </motion.div>
      </article>
    </div>
  );
}
