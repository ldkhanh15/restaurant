"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Star, Calendar, Clock, User, Eye, Heart, Share2, Search, Utensils } from "lucide-react"

const blogPosts = [
  {
    id: "blog-1",
    title: "Bí Quyết Chế Biến Cá Hồi Hoàn Hảo",
    excerpt: "Khám phá những kỹ thuật đặc biệt mà đầu bếp chúng tôi sử dụng để tạo ra món cá hồi nướng tuyệt vời",
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
    excerpt: "Tìm hiểu về triết lý thiết kế và cách chúng tôi tạo ra không gian ẩm thực đẳng cấp",
    content: `
      <h3>Triết Lý Thiết Kế</h3>
      <p>Không gian nhà hàng được thiết kế theo phong cách hiện đại kết hợp cổ điển, tạo ra một môi trường vừa sang trọng vừa ấm cúng. Mỗi góc nhỏ đều được chăm chút tỉ mỉ để mang lại trải nghiệm tốt nhất cho thực khách.</p>
      
      <h3>Màu Sắc và Ánh Sáng</h3>
      <p>Chúng tôi sử dụng tông màu trung tính với điểm nhấn vàng đồng, tạo cảm giác ấm áp và sang trọng. Hệ thống ánh sáng được thiết kế đa tầng, từ ánh sáng tự nhiên ban ngày đến ánh sáng ấm áp về đêm.</p>
      
      <h3>Nội Thất Cao Cấp</h3>
      <p>Tất cả nội thất đều được nhập khẩu từ Italy và Đức, từ bàn ghế đến đồ trang trí. Mỗi món đồ đều có câu chuyện riêng và góp phần tạo nên bầu không khí độc đáo của nhà hàng.</p>
      
      <h3>Không Gian Xanh</h3>
      <p>Cây xanh và hoa tươi được bố trí khéo léo khắp nhà hàng, không chỉ tạo điểm nhấn thị giác mà còn giúp thanh lọc không khí và mang lại cảm giác gần gũi với thiên nhiên.</p>
    `,
    image: "/elegant-restaurant-interior.png",
    author: "KTS Lê Thị Hương",
    date: "2024-01-10",
    category: "Thiết Kế",
    readTime: 6,
    views: 892,
    likes: 67,
    tags: ["thiết kế", "nội thất", "không gian", "sang trọng"],
    featured: false,
  },
  {
    id: "blog-3",
    title: "Menu Mùa Xuân 2024 - Hương Vị Tươi Mới",
    excerpt: "Giới thiệu những món ăn mới với nguyên liệu tươi ngon của mùa xuân",
    content: `
      <h3>Nguyên Liệu Mùa Xuân</h3>
      <p>Mùa xuân mang đến những nguyên liệu tươi ngon nhất trong năm. Chúng tôi đã tuyển chọn các loại rau củ, trái cây và hải sản tươi ngon nhất để tạo ra menu đặc biệt cho mùa này.</p>
      
      <h3>Món Khai Vị Mới</h3>
      <p>Salad măng tây với tôm hùm baby - sự kết hợp hoàn hảo giữa vị ngọt tự nhiên của măng tây non và hương vị đậm đà của tôm hùm. Được chấm với sốt vinaigrette chanh dây tự làm.</p>
      
      <h3>Món Chính Đặc Biệt</h3>
      <p>Cá bơn nướng với rau mùa xuân - cá bơn tươi được nướng hoàn hảo, kèm theo hỗn hợp rau củ mùa xuân như cà rốt baby, đậu Hà Lan và khoai tây mới.</p>
      
      <h3>Tráng Miệng Ngọt Ngào</h3>
      <p>Panna cotta dâu tây với bánh quy hạnh nhân - món tráng miệng nhẹ nhàng với hương vị dâu tây tươi mát, hoàn hảo để kết thúc bữa ăn mùa xuân.</p>
    `,
    image: "/chocolate-cake-dessert.jpg",
    author: "Chef Trần Văn Đức",
    date: "2024-01-05",
    category: "Menu Mới",
    readTime: 5,
    views: 1156,
    likes: 94,
    tags: ["menu mới", "mùa xuân", "nguyên liệu tươi", "đặc biệt"],
    featured: true,
  },
  {
    id: "blog-4",
    title: "Nghệ Thuật Pha Chế Cocktail Đẳng Cấp",
    excerpt: "Khám phá bí mật đằng sau những ly cocktail độc đáo tại nhà hàng",
    content: `
      <h3>Triết Lý Pha Chế</h3>
      <p>Mỗi ly cocktail tại nhà hàng không chỉ là thức uống mà còn là một tác phẩm nghệ thuật. Chúng tôi kết hợp kỹ thuật pha chế truyền thống với sự sáng tạo hiện đại.</p>
      
      <h3>Nguyên Liệu Cao Cấp</h3>
      <p>Tất cả spirits đều được nhập khẩu từ các nhà sản xuất uy tín. Các loại trái cây và thảo mộc được chọn lọc kỹ càng, đảm bảo độ tươi ngon tối đa.</p>
      
      <h3>Kỹ Thuật Đặc Biệt</h3>
      <p>Chúng tôi sử dụng nhiều kỹ thuật hiện đại như fat washing, clarification và molecular mixology để tạo ra những hương vị độc đáo không thể tìm thấy ở nơi khác.</p>
      
      <h3>Trình Bày Nghệ Thuật</h3>
      <p>Mỗi ly cocktail được trình bày như một tác phẩm nghệ thuật với garnish được chế tác thủ công và glassware được chọn lọc đặc biệt.</p>
    `,
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
    excerpt: "Hành trình tìm kiếm và lựa chọn những nguyên liệu tốt nhất cho nhà hàng",
    content: `
      <h3>Cam Kết Chất Lượng</h3>
      <p>Chúng tôi tin rằng món ăn ngon bắt đầu từ nguyên liệu tốt. Đó là lý do tại sao chúng tôi dành rất nhiều thời gian và công sức để tìm kiếm những nhà cung cấp uy tín nhất.</p>
      
      <h3>Hải Sản Tươi Sống</h3>
      <p>Tất cả hải sản đều được vận chuyển trực tiếp từ các vùng biển sạch. Cá hồi từ Na Uy, tôm hùm từ Australia, và hàu từ Pháp - tất cả đều đảm bảo độ tươi ngon tối đa.</p>
      
      <h3>Rau Củ Hữu Cơ</h3>
      <p>Chúng tôi hợp tác với các trang trại hữu cơ địa phương để có được những loại rau củ tươi ngon nhất. Mỗi sáng, rau củ được giao tận nơi để đảm bảo độ tươi.</p>
      
      <h3>Thịt Cao Cấp</h3>
      <p>Thịt bò Wagyu từ Nhật Bản, thịt cừu từ New Zealand - chúng tôi chỉ chọn những loại thịt có chất lượng cao nhất để phục vụ thực khách.</p>
    `,
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
  {
    id: "blog-6",
    title: "Lịch Sử và Truyền Thống Ẩm Thực Pháp",
    excerpt: "Tìm hiểu về nguồn gốc và sự phát triển của ẩm thực Pháp qua các thời kỳ",
    content: `
      <h3>Khởi Nguồn Ẩm Thực Pháp</h3>
      <p>Ẩm thực Pháp có lịch sử hàng nghìn năm, từ thời Trung cổ đến thời kỳ Phục hưng. Mỗi vùng miền đều có những đặc sản riêng biệt, tạo nên sự đa dạng phong phú.</p>
      
      <h3>Các Kỹ Thuật Cổ Điển</h3>
      <p>Những kỹ thuật như confit, sous vide, và flambé đã được truyền lại qua nhiều thế hệ đầu bếp. Chúng tôi áp dụng những kỹ thuật này để tạo ra những món ăn đậm chất Pháp.</p>
      
      <h3>Văn Hóa Ẩm Thực</h3>
      <p>Người Pháp coi việc ăn uống không chỉ là nhu cầu sinh lý mà còn là nghệ thuật sống. Mỗi bữa ăn đều là một dịp để thưởng thức và tận hưởng cuộc sống.</p>
      
      <h3>Ảnh Hưởng Toàn Cầu</h3>
      <p>Ẩm thực Pháp đã ảnh hưởng đến cả thế giới, từ kỹ thuật nấu nướng đến cách trình bày món ăn. Nhiều thuật ngữ ẩm thực quốc tế đều có nguồn gốc từ tiếng Pháp.</p>
    `,
    image: "/elegant-restaurant-interior.png",
    author: "Chef Consultant Pierre Dubois",
    date: "2024-01-03",
    category: "Văn Hóa",
    readTime: 9,
    views: 567,
    likes: 38,
    tags: ["ẩm thực pháp", "lịch sử", "truyền thống", "văn hóa"],
    featured: false,
  },
]

const categories = [
  { id: "all", name: "Tất Cả", count: blogPosts.length },
  {
    id: "Kỹ Thuật Nấu Ăn",
    name: "Kỹ Thuật Nấu Ăn",
    count: blogPosts.filter((p) => p.category === "Kỹ Thuật Nấu Ăn").length,
  },
  { id: "Menu Mới", name: "Menu Mới", count: blogPosts.filter((p) => p.category === "Menu Mới").length },
  { id: "Thiết Kế", name: "Thiết Kế", count: blogPosts.filter((p) => p.category === "Thiết Kế").length },
  { id: "Đồ Uống", name: "Đồ Uống", count: blogPosts.filter((p) => p.category === "Đồ Uống").length },
  { id: "Nguyên Liệu", name: "Nguyên Liệu", count: blogPosts.filter((p) => p.category === "Nguyên Liệu").length },
  { id: "Văn Hóa", name: "Văn Hóa", count: blogPosts.filter((p) => p.category === "Văn Hóa").length },
]

export default function BlogSystem() {
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<"date" | "views" | "likes">("date")
  const [selectedPost, setSelectedPost] = useState<string | null>(null)

  const filteredPosts = blogPosts
    .filter((post) => {
      const matchesCategory = selectedCategory === "all" || post.category === selectedCategory
      const matchesSearch =
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      return matchesCategory && matchesSearch
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "views":
          return b.views - a.views
        case "likes":
          return b.likes - a.likes
        default:
          return new Date(b.date).getTime() - new Date(a.date).getTime()
      }
    })

  const featuredPosts = blogPosts.filter((post) => post.featured)
  const currentPost = selectedPost ? blogPosts.find((p) => p.id === selectedPost) : null

  if (currentPost) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <button
                onClick={() => setSelectedPost(null)}
                className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
              >
                <Utensils className="h-8 w-8 text-primary" />
                <span className="text-xl font-bold">Blog Ẩm Thực</span>
              </button>
              <Button variant="outline" onClick={() => setSelectedPost(null)}>
                ← Quay Lại
              </Button>
            </div>
          </div>
        </nav>

        <article className="max-w-4xl mx-auto px-4 py-12">
          {/* Article Header */}
          <div className="mb-8">
            <Badge className="mb-4">{currentPost.category}</Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-balance">{currentPost.title}</h1>

            <div className="flex flex-wrap items-center gap-6 text-muted-foreground mb-6">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span>{currentPost.author}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>{new Date(currentPost.date).toLocaleDateString("vi-VN")}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span>{currentPost.readTime} phút đọc</span>
              </div>
              <div className="flex items-center space-x-2">
                <Eye className="w-4 h-4" />
                <span>{currentPost.views.toLocaleString()} lượt xem</span>
              </div>
            </div>

            <div className="flex items-center justify-between mb-8">
              <div className="flex flex-wrap gap-2">
                {currentPost.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    #{tag}
                  </Badge>
                ))}
              </div>
              <div className="flex items-center space-x-4">
                <Button variant="outline" size="sm">
                  <Heart className="w-4 h-4 mr-2" />
                  {currentPost.likes}
                </Button>
                <Button variant="outline" size="sm">
                  <Share2 className="w-4 h-4 mr-2" />
                  Chia sẻ
                </Button>
              </div>
            </div>
          </div>

          {/* Featured Image */}
          <div className="mb-8">
            <img
              src={currentPost.image || "/placeholder.svg"}
              alt={currentPost.title}
              className="w-full h-96 object-cover rounded-lg"
            />
          </div>

          {/* Article Content */}
          <div className="prose prose-lg max-w-none mb-12" dangerouslySetInnerHTML={{ __html: currentPost.content }} />

          {/* Related Posts */}
          <div className="border-t border-border pt-8">
            <h3 className="text-2xl font-bold mb-6">Bài Viết Liên Quan</h3>
            <div className="grid md:grid-cols-2 gap-6">
              {blogPosts
                .filter((post) => post.id !== currentPost.id && post.category === currentPost.category)
                .slice(0, 2)
                .map((post) => (
                  <Card
                    key={post.id}
                    className="group hover:shadow-xl transition-all duration-300 cursor-pointer"
                    onClick={() => setSelectedPost(post.id)}
                  >
                    <div className="relative overflow-hidden rounded-t-lg">
                      <img
                        src={post.image || "/placeholder.svg"}
                        alt={post.title}
                        className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <CardHeader>
                      <CardTitle className="text-lg group-hover:text-primary transition-colors line-clamp-2">
                        {post.title}
                      </CardTitle>
                      <CardDescription className="text-sm">
                        {new Date(post.date).toLocaleDateString("vi-VN")} • {post.readTime} phút đọc
                      </CardDescription>
                    </CardHeader>
                  </Card>
                ))}
            </div>
          </div>
        </article>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Blog Ẩm Thực</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Khám phá thế giới ẩm thực qua những câu chuyện, kỹ thuật và bí quyết từ các chuyên gia hàng đầu
          </p>
        </div>

        {/* Featured Posts */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Bài Viết Nổi Bật</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {featuredPosts.map((post) => (
              <Card
                key={post.id}
                className="group hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden"
                onClick={() => setSelectedPost(post.id)}
              >
                <div className="relative overflow-hidden">
                  <img
                    src={post.image || "/placeholder.svg"}
                    alt={post.title}
                    className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-primary/90 text-primary-foreground">{post.category}</Badge>
                  </div>
                  <div className="absolute bottom-4 right-4 bg-background/90 backdrop-blur-sm rounded-lg px-3 py-1">
                    <div className="flex items-center space-x-4 text-xs">
                      <div className="flex items-center space-x-1">
                        <Eye className="w-3 h-3" />
                        <span>{post.views}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Heart className="w-3 h-3" />
                        <span>{post.likes}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <CardHeader>
                  <CardTitle className="text-xl group-hover:text-primary transition-colors line-clamp-2">
                    {post.title}
                  </CardTitle>
                  <CardDescription className="line-clamp-2">{post.excerpt}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center space-x-4">
                      <span>{post.author}</span>
                      <span>{new Date(post.date).toLocaleDateString("vi-VN")}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{post.readTime} phút</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Tìm kiếm bài viết, thẻ tag..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={sortBy} onValueChange={(value: "date" | "views" | "likes") => setSortBy(value)}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Sắp xếp theo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Mới nhất</SelectItem>
                <SelectItem value="views">Lượt xem</SelectItem>
                <SelectItem value="likes">Yêu thích</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Category Pills */}
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
              >
                {category.name} ({category.count})
              </Button>
            ))}
          </div>
        </div>

        {/* Blog Posts Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map((post) => (
            <Card
              key={post.id}
              className="group hover:shadow-xl transition-all duration-300 cursor-pointer"
              onClick={() => setSelectedPost(post.id)}
            >
              <div className="relative overflow-hidden rounded-t-lg">
                <img
                  src={post.image || "/placeholder.svg"}
                  alt={post.title}
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-4 left-4">
                  <Badge className="bg-primary/90 text-primary-foreground">{post.category}</Badge>
                </div>
                {post.featured && (
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-yellow-500/90 text-yellow-900">
                      <Star className="w-3 h-3 mr-1 fill-current" />
                      Nổi bật
                    </Badge>
                  </div>
                )}
              </div>
              <CardHeader>
                <CardTitle className="text-lg group-hover:text-primary transition-colors line-clamp-2">
                  {post.title}
                </CardTitle>
                <CardDescription className="line-clamp-3">{post.excerpt}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                  <span>{post.author}</span>
                  <span>{new Date(post.date).toLocaleDateString("vi-VN")}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{post.readTime}p</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Eye className="w-3 h-3" />
                      <span>{post.views}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Heart className="w-3 h-3" />
                    <span>{post.likes}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 mt-3">
                  {post.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* No results */}
        {filteredPosts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">Không tìm thấy bài viết nào phù hợp với tiêu chí tìm kiếm</p>
          </div>
        )}
      </div>
    </div>
  )
}
