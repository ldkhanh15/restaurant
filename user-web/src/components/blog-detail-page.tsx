"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { useRouter } from "@/lib/router";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  Clock,
  User,
  Eye,
  Heart,
  Share2,
  ArrowLeft,
  BookOpen,
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

// Same blog data - in production, fetch from API
const blogPosts = [
  {
    id: "blog-1",
    title: "Bí Quyết Chế Biến Cá Hồi Hoàn Hảo",
    excerpt:
      "Khám phá những kỹ thuật đặc biệt mà đầu bếp chúng tôi sử dụng để tạo ra món cá hồi nướng tuyệt vời",
    content: `
      <h2 class="text-3xl font-elegant font-bold text-primary mb-6">Lựa Chọn Cá Hồi Tươi Ngon</h2>
      <p class="font-serif text-lg leading-relaxed mb-6 text-foreground">
        Bước đầu tiên để có một món cá hồi hoàn hảo là lựa chọn nguyên liệu tươi ngon. 
        Tại nhà hàng, chúng tôi chỉ sử dụng cá hồi Na Uy cao cấp, được vận chuyển bằng đường hàng không để đảm bảo độ tươi ngon tối đa.
      </p>
      
      <h2 class="text-3xl font-elegant font-bold text-primary mb-6">Kỹ Thuật Ướp Marinate Đặc Biệt</h2>
      <p class="font-serif text-lg leading-relaxed mb-6 text-foreground">
        Cá hồi được ướp với hỗn hợp gia vị bí mật bao gồm: muối biển Himalaya, tiêu đen nghiền thô, 
        thảo mộc tươi và một chút mật ong. Thời gian ướp tối thiểu 2 giờ để gia vị thấm đều.
      </p>
      
      <h2 class="text-3xl font-elegant font-bold text-primary mb-6">Nhiệt Độ Nướng Lý Tưởng</h2>
      <p class="font-serif text-lg leading-relaxed mb-6 text-foreground">
        Nhiệt độ nướng là yếu tố quyết định. Chúng tôi nướng ở 180°C trong 12-15 phút, 
        tùy thuộc vào độ dày của miếng cá. Bí quyết là nướng mặt da trước để tạo lớp giòn bên ngoài.
      </p>
      
      <h2 class="text-3xl font-elegant font-bold text-primary mb-6">Cách Trình Bày Đẹp Mắt</h2>
      <p class="font-serif text-lg leading-relaxed mb-6 text-foreground">
        Món ăn được trình bày trên đĩa sứ trắng, kèm theo rau củ nướng nhiều màu sắc và sốt hollandaise tự làm. 
        Điểm nhấn cuối cùng là lá thảo mộc tươi và một lát chanh.
      </p>
    `,
    image: "/grilled-salmon-dish.jpg",
    author: "Chef Nguyễn Minh Tuấn",
    date: "2024-01-15",
    category: "Kỹ Thuật Nấu Ăn",
    readTime: 8,
    views: 1247,
    likes: 89,
    tags: ["cá hồi", "nướng", "kỹ thuật", "chef"],
    featured: true,
  },
  // Add other posts...
];

interface BlogDetailPageProps {
  postId: string;
}

export default function BlogDetailPage({ postId }: BlogDetailPageProps) {
  const { navigate } = useRouter();
  const post = useMemo(() => blogPosts.find((p) => p.id === postId), [postId]);

  if (!post) {
    return (
      <div className="min-h-screen bg-gradient-cream flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground font-serif">
            Không tìm thấy bài viết
          </p>
          <Button onClick={() => navigate("blog")} className="mt-4">
            Quay Lại Blog
          </Button>
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
              onClick={() => navigate("blog")}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <BookOpen className="h-6 w-6 text-accent" />
              <span className="font-elegant text-lg font-semibold text-primary">
                Blog Ẩm Thực
              </span>
            </button>
            <Button
              variant="outline"
              onClick={() => navigate("blog")}
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
          <p className="font-serif text-xl text-muted-foreground mb-8 leading-relaxed">
            {post.excerpt}
          </p>

          <div className="flex flex-wrap items-center gap-6 text-muted-foreground mb-8">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5" />
              <span className="font-medium">{post.author}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              <span>
                {format(new Date(post.date), "EEEE, dd MMMM yyyy", {
                  locale: vi,
                })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              <span>{post.readTime} phút đọc</span>
            </div>
          </div>

          <Separator className="mb-8" />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">{post.views}</span>
              </div>
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">{post.likes}</span>
              </div>
            </div>
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
            src={post.image || "/placeholder.svg"}
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

        {/* Tags */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-12 pt-8 border-t border-accent/20"
        >
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="bg-accent/5 text-accent border-accent/20"
              >
                #{tag}
              </Badge>
            ))}
          </div>
        </motion.div>
      </article>
    </div>
  );
}
