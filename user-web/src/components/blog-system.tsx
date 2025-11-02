"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "@/lib/router";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  Clock,
  User,
  Eye,
  Heart,
  Share2,
  Search,
  BookOpen,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

const blogPosts = [
  {
    id: "blog-1",
    title: "Bí Quyết Chế Biến Cá Hồi Hoàn Hảo",
    excerpt:
      "Khám phá những kỹ thuật đặc biệt mà đầu bếp chúng tôi sử dụng để tạo ra món cá hồi nướng tuyệt vời",
    content: `
      <h3>Lựa Chọn Cá Hồi Tươi Ngon</h3>
      <p>Bước đầu tiên để có một món cá hồi hoàn hảo là lựa chọn nguyên liệu tươi ngon. Tại nhà hàng, chúng tôi chỉ sử dụng cá hồi Na Uy cao cấp, được vận chuyển bằng đường hàng không để đảm bảo độ tươi ngon tối đa.</p>
      
      <h3>Kỹ Thuật Ướp Marinate Đặc Biệt</h3>
      <p>Cá hồi được ướp với hỗn hợp gia vị bí mật bao gồm: muối biển Himalaya, tiêu đen nghiền thô, thảo mộc tươi và một chút mật ong. Thời gian ướp tối thiểu 2 giờ để gia vị thấm đều.</p>
      
      <h3>Nhiệt Độ Nướng Lý Tưởng</h3>
      <p>Nhiệt độ nướng là yếu tố quyết định. Chúng tôi nướng ở 180°C trong 12-15 phút, tùy thuộc vào độ dày của miếng cá. Bí quyết là nướng mặt da trước để tạo lớp giòn bên ngoài.</p>
      
      <h3>Cách Trình Bày Đẹp Mắt</h3>
      <p>Món ăn được trình bày trên đĩa sứ trắng, kèm theo rau củ nướng nhiều màu sắc và sốt hollandaise tự làm. Điểm nhấn cuối cùng là lá thảo mộc tươi và một lát chanh.</p>
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
  {
    id: "blog-2",
    title: "Không Gian Sang Trọng - Thiết Kế Nhà Hàng",
    excerpt:
      "Tìm hiểu về triết lý thiết kế và cách chúng tôi tạo ra không gian ẩm thực đẳng cấp",
    content: `
      <h3>Triết Lý Thiết Kế</h3>
      <p>Không gian nhà hàng được thiết kế theo phong cách hiện đại kết hợp cổ điển, tạo ra một môi trường vừa sang trọng vừa ấm cúng.</p>
    `,
    image: "/elegant-restaurant-interior.png",
    author: "KTS Lê Thị Hương",
    date: "2024-01-10",
    category: "Thiết Kế",
    readTime: 6,
    views: 892,
    likes: 67,
    tags: ["thiết kế", "nội thất", "không gian", "sang trọng"],
    featured: true,
  },
  {
    id: "blog-3",
    title: "Menu Mùa Xuân 2024 - Hương Vị Tươi Mới",
    excerpt:
      "Giới thiệu những món ăn mới với nguyên liệu tươi ngon của mùa xuân",
    content: `<p>Menu mùa xuân với nguyên liệu tươi ngon nhất.</p>`,
    image: "/chocolate-cake-dessert.jpg",
    author: "Chef Trần Văn Đức",
    date: "2024-01-05",
    category: "Menu Mới",
    readTime: 5,
    views: 1156,
    likes: 94,
    tags: ["menu mới", "mùa xuân", "nguyên liệu tươi", "đặc biệt"],
    featured: false,
  },
  {
    id: "blog-4",
    title: "Nghệ Thuật Pha Chế Cocktail Đẳng Cấp",
    excerpt: "Khám phá bí mật đằng sau những ly cocktail độc đáo tại nhà hàng",
    content: `<p>Nghệ thuật pha chế cocktail đẳng cấp.</p>`,
    image: "/mojito-cocktail.jpg",
    author: "Bartender Phạm Minh Hải",
    date: "2024-01-12",
    category: "Đồ Uống",
    readTime: 7,
    views: 743,
    likes: 52,
    tags: ["cocktail", "pha chế", "nghệ thuật", "đồ uống"],
    featured: false,
  },
  {
    id: "blog-5",
    title: "Câu Chuyện Về Nguồn Gốc Nguyên Liệu",
    excerpt:
      "Hành trình tìm kiếm và lựa chọn những nguyên liệu tốt nhất cho nhà hàng",
    content: `<p>Câu chuyện về nguồn gốc nguyên liệu.</p>`,
    image: "/premium-beef-steak.jpg",
    author: "Quản lý F&B Nguyễn Thị Lan",
    date: "2024-01-08",
    category: "Nguyên Liệu",
    readTime: 6,
    views: 634,
    likes: 41,
    tags: ["nguyên liệu", "chất lượng", "nguồn gốc", "tươi ngon"],
    featured: false,
  },
];

const categories = [
  { id: "all", name: "Tất Cả", count: blogPosts.length },
  {
    id: "Kỹ Thuật Nấu Ăn",
    name: "Kỹ Thuật Nấu Ăn",
    count: blogPosts.filter((p) => p.category === "Kỹ Thuật Nấu Ăn").length,
  },
  {
    id: "Menu Mới",
    name: "Menu Mới",
    count: blogPosts.filter((p) => p.category === "Menu Mới").length,
  },
  {
    id: "Thiết Kế",
    name: "Thiết Kế",
    count: blogPosts.filter((p) => p.category === "Thiết Kế").length,
  },
  {
    id: "Đồ Uống",
    name: "Đồ Uống",
    count: blogPosts.filter((p) => p.category === "Đồ Uống").length,
  },
  {
    id: "Nguyên Liệu",
    name: "Nguyên Liệu",
    count: blogPosts.filter((p) => p.category === "Nguyên Liệu").length,
  },
];

// Reusable BlogCard Component
const BlogCard = ({
  post,
  index,
  variant = "default",
  onClick,
}: {
  post: (typeof blogPosts)[0];
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
            src={post.image || "/placeholder.svg"}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
          <div className="absolute top-4 left-4 z-20">
            <Badge className="bg-accent/20 text-accent border border-accent/30 backdrop-blur-sm">
              {post.category}
            </Badge>
          </div>
          {post.featured && (
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
            {variant === "featured" && (
              <p className="text-white/90 text-sm line-clamp-2 font-serif">
                {post.excerpt}
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
              {post.excerpt}
            </CardDescription>
          </CardHeader>
        )}
        <CardContent className={variant === "featured" ? "p-6" : ""}>
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <User className="h-4 w-4" />
                <span>{post.author}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                <span>
                  {format(new Date(post.date), "dd/MM/yyyy", { locale: vi })}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                <span>{post.readTime} phút</span>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{post.views}</span>
              </div>
              <div className="flex items-center gap-1">
                <Heart className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{post.likes}</span>
              </div>
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
  const { navigate } = useRouter();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "views" | "likes">("date");

  const filteredPosts = useMemo(() => {
    const filtered = blogPosts.filter((post) => {
      const matchesCategory =
        selectedCategory === "all" || post.category === selectedCategory;
      const matchesSearch =
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.tags.some((tag) =>
          tag.toLowerCase().includes(searchQuery.toLowerCase())
        );
      return matchesCategory && matchesSearch;
    });

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "views":
          return b.views - a.views;
        case "likes":
          return b.likes - a.likes;
        default:
          return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
    });

    return filtered;
  }, [selectedCategory, searchQuery, sortBy]);

  const featuredPosts = blogPosts.filter((post) => post.featured);
  const regularPosts = filteredPosts.filter(
    (post) => !post.featured || !featuredPosts.includes(post)
  );

  const handlePostClick = (postId: string) => {
    navigate("blog-detail", { id: postId });
  };

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

          {/* Search and Filters */}
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
            <Select
              value={sortBy}
              onValueChange={(value: any) => setSortBy(value)}
            >
              <SelectTrigger className="w-full md:w-48 border-accent/20 focus:border-accent">
                <SelectValue placeholder="Sắp xếp theo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Mới nhất</SelectItem>
                <SelectItem value="views">Xem nhiều nhất</SelectItem>
                <SelectItem value="likes">Yêu thích nhất</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Category Pills */}
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
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
                  {category.name} ({category.count})
                </Button>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Featured Posts Section */}
        {featuredPosts.length > 0 && (
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
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Large Featured Post */}
              <div className="lg:col-span-2">
                <BlogCard
                  post={featuredPosts[0]}
                  index={0}
                  variant="featured"
                  onClick={() => handlePostClick(featuredPosts[0].id)}
                />
              </div>
              {/* Small Featured Posts */}
              <div className="space-y-6">
                {featuredPosts.slice(1, 3).map((post, idx) => (
                  <BlogCard
                    key={post.id}
                    post={post}
                    index={idx + 1}
                    variant="default"
                    onClick={() => handlePostClick(post.id)}
                  />
                ))}
              </div>
            </div>
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
          </h2>
          {regularPosts.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {regularPosts.map((post, index) => (
                <BlogCard
                  key={post.id}
                  post={post}
                  index={index}
                  variant="default"
                  onClick={() => handlePostClick(post.id)}
                />
              ))}
            </div>
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
