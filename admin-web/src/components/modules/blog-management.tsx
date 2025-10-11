"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Plus, Edit, Eye, Trash2, ImageIcon } from "lucide-react"

interface BlogPost {
  id: number
  title: string
  content: string
  excerpt: string
  images: string[]
  status: "draft" | "published" | "archived"
  author_id: number
  author_name: string
  published_at?: string
  created_at: string
  updated_at: string
  views: number
  category: string
  tags: string[]
}

const mockBlogPosts: BlogPost[] = [
  {
    id: 1,
    title: "Bí quyết nấu phở bò ngon như quán",
    content:
      "Phở bò là món ăn truyền thống của Việt Nam, được yêu thích bởi hương vị đậm đà và cách chế biến tinh tế...",
    excerpt: "Khám phá bí quyết nấu nước dùng phở trong vắt, thơm ngon",
    images: ["/placeholder.svg?key=blog1"],
    status: "published",
    author_id: 1,
    author_name: "Bếp trưởng Minh",
    published_at: "2024-03-15T10:00:00",
    created_at: "2024-03-14T15:30:00",
    updated_at: "2024-03-15T10:00:00",
    views: 1250,
    category: "Công thức",
    tags: ["phở", "nước dùng", "bí quyết"],
  },
  {
    id: 2,
    title: "Thực đơn mùa xuân 2024",
    content: "Chào đón mùa xuân với những món ăn tươi mới, nhẹ nhàng và đầy màu sắc...",
    excerpt: "Giới thiệu các món ăn mới trong thực đơn mùa xuân",
    images: ["/placeholder.svg?key=blog2", "/placeholder.svg?key=blog3"],
    status: "published",
    author_id: 2,
    author_name: "Quản lý Lan",
    published_at: "2024-03-10T14:00:00",
    created_at: "2024-03-08T09:15:00",
    updated_at: "2024-03-10T14:00:00",
    views: 890,
    category: "Thực đơn",
    tags: ["mùa xuân", "thực đơn mới", "món ăn"],
  },
  {
    id: 3,
    title: "Cách bảo quản nguyên liệu tươi ngon",
    content: "Việc bảo quản nguyên liệu đúng cách là yếu tố quan trọng để đảm bảo chất lượng món ăn...",
    excerpt: "Hướng dẫn bảo quản nguyên liệu để giữ được độ tươi ngon",
    images: [],
    status: "draft",
    author_id: 1,
    author_name: "Bếp trưởng Minh",
    created_at: "2024-03-18T11:20:00",
    updated_at: "2024-03-19T16:45:00",
    views: 0,
    category: "Hướng dẫn",
    tags: ["bảo quản", "nguyên liệu", "chất lượng"],
  },
]

export function BlogManagement() {
  const [posts, setPosts] = useState<BlogPost[]>(mockBlogPosts)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)

  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.author_name.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || post.status === statusFilter
    const matchesCategory = categoryFilter === "all" || post.category === categoryFilter

    return matchesSearch && matchesStatus && matchesCategory
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <Badge className="bg-yellow-100 text-yellow-800">Nháp</Badge>
      case "published":
        return <Badge className="bg-green-100 text-green-800">Đã xuất bản</Badge>
      case "archived":
        return <Badge className="bg-gray-100 text-gray-800">Lưu trữ</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const updatePostStatus = (postId: number, newStatus: string) => {
    setPosts(
      posts.map((post) =>
        post.id === postId
          ? {
              ...post,
              status: newStatus as any,
              published_at: newStatus === "published" ? new Date().toISOString() : post.published_at,
              updated_at: new Date().toISOString(),
            }
          : post,
      ),
    )
  }

  const categories = [...new Set(posts.map((p) => p.category))]
  const publishedPosts = posts.filter((p) => p.status === "published").length
  const draftPosts = posts.filter((p) => p.status === "draft").length
  const totalViews = posts.reduce((sum, p) => sum + p.views, 0)

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tổng bài viết</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{posts.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Đã xuất bản</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{publishedPosts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Bản nháp</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{draftPosts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tổng lượt xem</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{totalViews.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Tìm kiếm bài viết..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              <SelectItem value="draft">Nháp</SelectItem>
              <SelectItem value="published">Đã xuất bản</SelectItem>
              <SelectItem value="archived">Lưu trữ</SelectItem>
            </SelectContent>
          </Select>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Danh mục" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả danh mục</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Tạo bài viết
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle>Tạo bài viết mới</DialogTitle>
              <DialogDescription>Viết bài blog mới cho website nhà hàng</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="post-title">Tiêu đề</Label>
                <Input id="post-title" placeholder="Nhập tiêu đề bài viết" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="post-excerpt">Tóm tắt</Label>
                <Input id="post-excerpt" placeholder="Tóm tắt ngắn gọn về bài viết" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="post-category">Danh mục</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn danh mục" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Công thức">Công thức</SelectItem>
                      <SelectItem value="Thực đơn">Thực đơn</SelectItem>
                      <SelectItem value="Hướng dẫn">Hướng dẫn</SelectItem>
                      <SelectItem value="Tin tức">Tin tức</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="post-tags">Tags (phân cách bằng dấu phẩy)</Label>
                  <Input id="post-tags" placeholder="tag1, tag2, tag3" />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="post-content">Nội dung</Label>
                <Textarea id="post-content" placeholder="Viết nội dung bài viết..." className="min-h-[200px]" />
              </div>
              <div className="grid gap-2">
                <Label>Hình ảnh</Label>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                  <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Kéo thả hình ảnh hoặc click để chọn</p>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline">Lưu nháp</Button>
              <Button type="submit">Xuất bản</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Blog Posts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách bài viết</CardTitle>
          <CardDescription>Quản lý tất cả bài viết blog ({filteredPosts.length} bài viết)</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tiêu đề</TableHead>
                <TableHead>Tác giả</TableHead>
                <TableHead>Danh mục</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Lượt xem</TableHead>
                <TableHead>Ngày tạo</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPosts.map((post) => (
                <TableRow key={post.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium line-clamp-1">{post.title}</p>
                      <p className="text-sm text-muted-foreground line-clamp-1">{post.excerpt}</p>
                    </div>
                  </TableCell>
                  <TableCell>{post.author_name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{post.category}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {getStatusBadge(post.status)}
                      <Select value={post.status} onValueChange={(value) => updatePostStatus(post.id, value)}>
                        <SelectTrigger className="w-32 h-6 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Nháp</SelectItem>
                          <SelectItem value="published">Xuất bản</SelectItem>
                          <SelectItem value="archived">Lưu trữ</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </TableCell>
                  <TableCell>{post.views.toLocaleString()}</TableCell>
                  <TableCell>{new Date(post.created_at).toLocaleDateString("vi-VN")}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedPost(post)
                          setIsViewDialogOpen(true)
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* View Post Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selectedPost?.title}</DialogTitle>
            <DialogDescription>
              Bởi {selectedPost?.author_name} • {selectedPost?.category} •{" "}
              {selectedPost?.created_at && new Date(selectedPost.created_at).toLocaleDateString("vi-VN")}
            </DialogDescription>
          </DialogHeader>
          {selectedPost && (
            <div className="space-y-4">
              <div className="flex gap-2">
                {getStatusBadge(selectedPost.status)}
                <Badge variant="outline">{selectedPost.views.toLocaleString()} lượt xem</Badge>
              </div>

              {selectedPost.images.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {selectedPost.images.map((image, index) => (
                    <img
                      key={index}
                      src={image || "/placeholder.svg"}
                      alt={`Blog image ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  ))}
                </div>
              )}

              <div>
                <h4 className="font-medium mb-2">Tóm tắt</h4>
                <p className="text-sm text-muted-foreground">{selectedPost.excerpt}</p>
              </div>

              <div>
                <h4 className="font-medium mb-2">Nội dung</h4>
                <div className="text-sm text-muted-foreground whitespace-pre-wrap max-h-60 overflow-y-auto">
                  {selectedPost.content}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Tags</h4>
                <div className="flex gap-2 flex-wrap">
                  {selectedPost.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t text-sm text-muted-foreground">
                <div>
                  <p>Tạo: {new Date(selectedPost.created_at).toLocaleString("vi-VN")}</p>
                  <p>Cập nhật: {new Date(selectedPost.updated_at).toLocaleString("vi-VN")}</p>
                </div>
                {selectedPost.published_at && (
                  <p>Xuất bản: {new Date(selectedPost.published_at).toLocaleString("vi-VN")}</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
