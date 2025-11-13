"use client";

import ReactQuill, { Quill } from "react-quill";
import "react-quill/dist/quill.snow.css";
import ImageResize from "quill-image-resize-module-react";
// ✅ Đăng ký module resize ảnh
Quill.register("modules/imageResize", ImageResize);

// ✅ Đăng ký kích thước font tùy chỉnh
const Size: any = Quill.import("attributors/style/size");
Size.whitelist = ["10px", "12px", "14px", "16px", "18px", "24px", "32px"];
Quill.register(Size, true);

// Add type declaration for window.quillRef
declare global {
  interface Window {
    quillRef: any;
  }
}

import { useEffect, useState, useRef, useMemo } from "react";
import { blogService } from "@/services/blogService";
import { BlogPost } from "@/type/Blog";

import {
  uploadMultipleImagesToCloudinary,
  deleteMultipleImagesFromCloudinary,
  uploadImageToCloudinary,
} from "@/services/cloudinaryService";
import { toast } from "react-toastify";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Plus,
  Edit,
  Eye,
  Trash2,
  ImageIcon,
  Upload,
  X,
  FileText,
  User,
  FolderOpen,
  Calendar,
  Info,
  Tag,
  Clock,
  Globe,
  ExternalLink,
} from "lucide-react";
import dynamic from "next/dynamic";
import React from "react";

export function BlogManagement() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    meta_description: "",
    category: "",
    tags: [] as string[],
    status: "draft" as "draft" | "published" | "deleted",
    thumbnail_url: "",
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validation state
  const [validationErrors, setValidationErrors] = useState<{
    title?: string;
    meta_description?: string;
    category?: string;
    tags?: string;
    content?: string;
    thumbnail?: string;
  }>({});

  // UI state
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Validation functions
  const validateForm = () => {
    const errors: typeof validationErrors = {};

    // Title validation
    if (!formData.title.trim()) {
      errors.title = "Tiêu đề là bắt buộc";
    } else if (formData.title.length < 10) {
      errors.title = "Tiêu đề phải có ít nhất 10 ký tự";
    } else if (formData.title.length > 100) {
      errors.title = "Tiêu đề không được vượt quá 100 ký tự";
    }

    // Meta description validation
    if (!formData.meta_description.trim()) {
      errors.meta_description = "Meta description là bắt buộc";
    } else if (formData.meta_description.length < 120) {
      errors.meta_description =
        "Meta description nên có ít nhất 120 ký tự cho SEO";
    } else if (formData.meta_description.length > 160) {
      errors.meta_description =
        "Meta description không được vượt quá 160 ký tự";
    }

    // Category validation
    if (!formData.category) {
      errors.category = "Vui lòng chọn danh mục";
    }

    // Tags validation
    if (formData.tags.length === 0) {
      errors.tags = "Ít nhất một tag là bắt buộc";
    }

    // Content validation
    if (
      !formData.content ||
      formData.content.replace(/<[^>]*>/g, "").trim().length < 50
    ) {
      errors.content = "Nội dung phải có ít nhất 50 ký tự";
    }

    // Thumbnail validation
    if (isEditDialogOpen && selectedPost?.thumbnail_url) {
      // Allow existing thumbnail
    } else if (!selectedImage) {
      errors.thumbnail = "Ảnh đại diện là bắt buộc";
    } else if (selectedImage.size > 5 * 1024 * 1024) {
      // 5MB
      errors.thumbnail = "Kích thước ảnh không được vượt quá 5MB";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Real-time validation
  const validateField = (field: keyof typeof validationErrors, value: any) => {
    const errors = { ...validationErrors };

    switch (field) {
      case "title":
        if (!value.trim()) {
          errors.title = "Tiêu đề là bắt buộc";
        } else if (value.length < 10) {
          errors.title = "Tiêu đề phải có ít nhất 10 ký tự";
        } else if (value.length > 100) {
          errors.title = "Tiêu đề không được vượt quá 100 ký tự";
        } else {
          delete errors.title;
        }
        break;

      case "meta_description":
        if (!value.trim()) {
          errors.meta_description = "Meta description là bắt buộc";
        } else if (value.length < 120) {
          errors.meta_description =
            "Meta description nên có ít nhất 120 ký tự cho SEO";
        } else if (value.length > 160) {
          errors.meta_description =
            "Meta description không được vượt quá 160 ký tự";
        } else {
          delete errors.meta_description;
        }
        break;

      case "category":
        if (!value) {
          errors.category = "Vui lòng chọn danh mục";
        } else {
          delete errors.category;
        }
        break;

      case "tags":
        if (value.length === 0) {
          errors.tags = "Ít nhất một tag là bắt buộc";
        } else {
          delete errors.tags;
        }
        break;

      case "content":
        if (!value || value.replace(/<[^>]*>/g, "").trim().length < 50) {
          errors.content = "Nội dung phải có ít nhất 50 ký tự";
        } else {
          delete errors.content;
        }
        break;

      case "thumbnail":
        if (!value) {
          errors.thumbnail = "Ảnh đại diện là bắt buộc";
        } else if (value.size > 5 * 1024 * 1024) {
          errors.thumbnail = "Kích thước ảnh không được vượt quá 5MB";
        } else {
          delete errors.thumbnail;
        }
        break;
    }

    setValidationErrors(errors);
  };

  // Hàm custom xử lý khi chọn ảnh - insert base64 preview
  const imageHandler = () => {
    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("accept", "image/*");
    input.click();

    input.onchange = async () => {
      const file = input.files?.[0];
      if (file) {
        // Convert to base64 and insert as preview
        const reader = new FileReader();
        reader.onload = (e) => {
          const base64 = e.target?.result as string;
          // Use window.quillRef instead of quillRef.current for consistency
          const quill = window.quillRef;
          if (quill) {
            const range = quill.getSelection();
            quill.insertEmbed(range?.index || 0, "image", base64);
          } else {
            console.error("Quill editor not available");
          }
        };
        reader.readAsDataURL(file);
      }
    };
  };

  // Function to process content before submit - upload base64 images and replace with cloud URLs
  const processContentBeforeSubmit = async (
    content: string
  ): Promise<string> => {
    if (!content) return content;

    // Parse HTML to find all img tags with base64 src
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, "text/html");
    const images = doc.querySelectorAll("img");

    const base64Images: { element: HTMLImageElement; base64: string }[] = [];

    // Collect all base64 images
    images.forEach((img) => {
      const src = img.getAttribute("src") || "";
      if (src.startsWith("data:image/")) {
        base64Images.push({ element: img, base64: src });
      }
    });

    if (base64Images.length === 0) {
      return content; // No base64 images to process
    }

    // Convert base64 to File objects for upload
    const files: File[] = [];
    for (const { base64 } of base64Images) {
      try {
        const response = await fetch(base64);
        const blob = await response.blob();
        const file = new File([blob], `image-${Date.now()}.png`, {
          type: blob.type,
        });
        files.push(file);
      } catch (error) {
        console.error("Failed to convert base64 to file:", error);
        // Skip this image if conversion fails
      }
    }

    if (files.length === 0) {
      return content; // No files to upload
    }

    try {
      // Upload all images to Cloudinary
      const uploadedUrls = await uploadMultipleImagesToCloudinary(
        files,
        "blog"
      );

      // Replace base64 src with cloud URLs
      let updatedContent = content;
      base64Images.forEach(({ base64 }, index) => {
        if (uploadedUrls[index]) {
          updatedContent = updatedContent.replace(base64, uploadedUrls[index]);
        }
      });

      return updatedContent;
    } catch (error) {
      console.error("Failed to upload images:", error);
      throw new Error("Failed to upload images from content");
    }
  };

  const quillRef = React.useRef();

  const modules = useMemo(
    () => ({
      toolbar: {
        container: [
          ["bold", "italic", "underline", "strike"], // toggled buttons
          ["blockquote", "code-block"],
          ["link", "image", "video", "formula"],

          [{ header: 1 }, { header: 2 }], // custom button values
          [{ list: "ordered" }, { list: "bullet" }, { list: "check" }],
          [{ script: "sub" }, { script: "super" }], // superscript/subscript
          [{ indent: "-1" }, { indent: "+1" }], // outdent/indent
          [{ direction: "rtl" }], // text direction

          [{ size: ["small", false, "large", "huge"] }], // custom dropdown
          [{ header: [1, 2, 3, 4, 5, 6, false] }],

          [{ color: [] }, { background: [] }], // dropdown with defaults from theme
          [{ font: [] }],
          [{ align: [] }],

          ["clean"], // remove formatting button
        ],
        handlers: {
          image: imageHandler,
        },
      },
      imageResize: {
        parchment: Quill.import("parchment"),
        modules: ["Resize", "DisplaySize"],
      },
    }),
    []
  );

  const [content, setContent] = useState("");

  const handleSubmit = () => {
    // Gửi API POST /api/blogs
  };

  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      post?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post?.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post?.author?.username.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || post?.status === statusFilter;
    const matchesCategory =
      categoryFilter === "all" || post?.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <Badge className="bg-yellow-100 text-yellow-800">Nháp</Badge>;
      case "published":
        return (
          <Badge className="bg-green-100 text-green-800">Đã xuất bản</Badge>
        );
      case "deleted":
        return <Badge className="bg-gray-100 text-gray-800">Lưu trữ</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const updatePostStatus = async (postId: string, newStatus: string) => {
    try {
      await blogService.update(postId, { status: newStatus });
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? {
                ...post,
                status: newStatus as any,
              }
            : post
        )
      );
      toast.success(
        `Đã cập nhật trạng thái bài viết thành ${
          newStatus === "published"
            ? "đã xuất bản"
            : newStatus === "draft"
            ? "nháp"
            : "lưu trữ"
        }`
      );
    } catch (error) {
      console.error("Failed to update post status:", error);
      toast.error("Không thể cập nhật trạng thái bài viết");
    }
  };

  const fetchPosts = async () => {
    try {
      setIsLoading(true);
      const params = {
        search: searchTerm || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        category: categoryFilter !== "all" ? categoryFilter : undefined,
      };
      const response = await blogService.list(params);
      setPosts(response.data || []);
    } catch (error) {
      console.error("Failed to fetch posts:", error);
      toast.error("Không thể tải danh sách bài viết");
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("Vui lòng chọn file ảnh hợp lệ");
        return;
      } // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        validateField("thumbnail", file);
        toast.error("Kích thước ảnh không được vượt quá 5MB");
        return;
      }

      setSelectedImage(file);
      // Create preview URL
      const preview = URL.createObjectURL(file);
      setImagePreview(preview);
      validateField("thumbnail", file);
    }
  };

  const handleImageUpload = async (): Promise<string | null> => {
    if (!selectedImage) return null;

    setUploadingImage(true);
    setUploadProgress(0);

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const urls = await uploadImageToCloudinary(selectedImage, "blog");

      clearInterval(progressInterval);
      setUploadProgress(100);

      // Reset progress after a short delay
      setTimeout(() => setUploadProgress(0), 1000);

      toast.success("Ảnh đã được upload thành công");

      return urls;
    } catch (error) {
      console.error("Failed to upload image:", error);
      setUploadProgress(0);
      toast.error("Không thể upload ảnh");
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      content: "",
      meta_description: "",
      category: "",
      tags: [],
      status: "draft",
      thumbnail_url: "",
    });
    setSelectedImage(null);
    setImagePreview("");
    setValidationErrors({});
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const openEditDialog = (post: BlogPost) => {
    setSelectedPost(post);
    setFormData({
      title: post.title,
      content: post.content,
      meta_description: post.meta_description || "",
      category: post.category || "",
      tags: Array.isArray(post.tags) ? post.tags : [],
      status: post.status || "draft",
      thumbnail_url: post.thumbnail_url || "",
    });
    setImagePreview(post.thumbnail_url || "");
    setIsEditDialogOpen(true);
  };

  const submitForm = async () => {
    console.log("submitForm called");
    // Validate form before submission
    if (!validateForm()) {
      console.log("Validation failed:", validationErrors);
      toast.error("Vui lòng kiểm tra lại các trường bắt buộc");
      return;
    }

    setIsSubmitting(true);
    let uploadedImageUrl: string | null = null;

    try {
      // Upload image first if selected
      uploadedImageUrl = await handleImageUpload();

      console.log("before form data submit:", formData);

      // Process content to upload any base64 images and replace with cloud URLs
      const processedContent = await processContentBeforeSubmit(
        formData.content
      );

      const postData = {
        ...formData,
        content: processedContent, // Use processed content with cloud URLs
        thumbnail_url: uploadedImageUrl || formData.thumbnail_url,
        published_at: formData.status === "published" ? new Date() : null,
      };

      console.log("after Post data to submit:", postData);
      if (selectedPost) {
        console.log("Updating post ID:", selectedPost.id);
        // Update

        console.log("Updating post with data:", postData);
        await blogService.update(selectedPost.id, postData);
        setPosts((prev) =>
          prev.map((p) =>
            p.id === selectedPost.id ? { ...p, ...postData } : p
          )
        );
        toast.success("Đã cập nhật bài viết");
        setIsEditDialogOpen(false);
      } else {
        console.log("Creating new post with data:", postData);
        // Create
        const response = await blogService.create(postData);
        setPosts((prev) => [response.data, ...prev]);
        toast.success("Đã tạo bài viết mới");
        setIsCreateDialogOpen(false);
      }

      resetForm();
      fetchPosts();
    } catch (error) {
      console.error("catch 1231 13 123  Failed to save post:", error);

      // If image was uploaded but database operation failed, clean up uploaded image
      if (uploadedImageUrl) {
        try {
          await deleteMultipleImagesFromCloudinary([uploadedImageUrl]);
        } catch (cleanupError) {
          console.error("Failed to cleanup uploaded image:", cleanupError);
          // Don't show cleanup error to user as the main error is already shown
        }
      }

      toast.error("Không thể lưu bài viết");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa bài viết này?")) return;

    try {
      await blogService.remove(postId);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      toast.success("Đã xóa bài viết");
    } catch (error) {
      console.error("Failed to delete post:", error);
      toast.error("Không thể xóa bài viết");
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [searchTerm, statusFilter, categoryFilter]);
  const getInitials = (name?: string) => {
    if (!name) return "KV"; // Khách Vãng Lai
    return name
      .split(" ")
      .filter(Boolean)
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const categories = [...new Set(posts.map((p) => p?.category))];
  const publishedPosts = posts.filter((p) => p?.status === "published").length;
  const draftPosts = posts.filter((p) => p?.status === "draft").length;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tổng bài viết
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{posts.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Đã xuất bản
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {publishedPosts}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Bản nháp
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {draftPosts}
            </div>
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
              <SelectItem value="deleted">Lưu trữ</SelectItem>
            </SelectContent>
          </Select>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Danh mục" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả danh mục</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category ?? "Khác"}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {/* blog create */}
        <Dialog
          open={isCreateDialogOpen}
          onOpenChange={(open) => {
            setIsCreateDialogOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Tạo bài viết
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-5xl max-h-[95vh] overflow-y-auto">
            <DialogHeader className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Plus className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <DialogTitle className="text-xl">
                      Tạo bài viết mới
                    </DialogTitle>
                    <DialogDescription className="text-base">
                      Viết bài blog mới cho website nhà hàng của bạn
                    </DialogDescription>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant={isPreviewMode ? "default" : "outline"}
                    size="sm"
                    onClick={() => setIsPreviewMode(!isPreviewMode)}
                    className="flex items-center gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    {isPreviewMode ? "Chỉnh sửa" : "Xem trước"}
                  </Button>
                </div>
              </div>
            </DialogHeader>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!isPreviewMode) {
                  submitForm();
                }
              }}
              className="space-y-8"
            >
              {isPreviewMode ? (
                // Preview Mode
                <div className="space-y-8">
                  <div className="bg-muted/30 rounded-lg p-6">
                    <div className="flex items-center gap-2 pb-4 border-b">
                      <Eye className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-semibold">
                        Xem trước bài viết
                      </h3>
                    </div>

                    <div className="space-y-6">
                      {/* Preview Header */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>
                            ✏️ {formData.category || "Chưa chọn danh mục"}
                          </span>
                          <span>•</span>
                          <span>
                            📅 {new Date().toLocaleDateString("vi-VN")}
                          </span>
                        </div>

                        <h1 className="text-3xl font-bold text-gray-900">
                          {formData.title || "Tiêu đề bài viết"}
                        </h1>

                        <p className="text-lg text-gray-600 leading-relaxed">
                          {formData.meta_description ||
                            "Mô tả meta description sẽ hiển thị ở đây"}
                        </p>

                        {formData.tags.length > 0 && (
                          <div className="flex gap-2 flex-wrap">
                            {formData.tags.map((tag, index) => (
                              <Badge key={index} variant="secondary">
                                #{tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Preview Thumbnail */}
                      {imagePreview && (
                        <div className="flex justify-center">
                          <div className="border border-gray-300 rounded-lg p-2 bg-gray-50 hover:shadow-md transition">
                            <img
                              src={imagePreview}
                              alt="Blog thumbnail"
                              className="w-96 h-56 object-cover rounded-md"
                            />
                          </div>
                        </div>
                      )}

                      {/* Preview Content */}
                      <div className="bg-white rounded-lg border p-6">
                        <div
                          className="ql-editor max-w-none text-gray-800"
                          dangerouslySetInnerHTML={{
                            __html:
                              formData.content ||
                              "<p class='text-muted-foreground italic'>Nội dung bài viết sẽ hiển thị ở đây...</p>",
                          }}
                          style={{
                            padding: 0,
                            border: "none",
                            boxShadow: "none",
                            fontSize: "16px",
                            lineHeight: "1.6",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                // Edit Mode
                <>
                  {/* Basic Information Section */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 pb-2 border-b">
                      <FileText className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-semibold">
                        Thông tin cơ bản
                      </h3>
                    </div>

                    <div className="grid gap-6">
                      <div className="grid gap-2">
                        <Label
                          htmlFor="post-title"
                          className="text-sm font-medium"
                        >
                          Tiêu đề bài viết{" "}
                          <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="post-title"
                          placeholder="Nhập tiêu đề hấp dẫn cho bài viết..."
                          value={formData.title}
                          onChange={(e) => {
                            const value = e.target.value;
                            setFormData((prev) => ({
                              ...prev,
                              title: value,
                            }));
                            validateField("title", value);
                          }}
                          className={`text-lg h-12 ${
                            validationErrors.title
                              ? "border-red-500 focus:border-red-500"
                              : ""
                          }`}
                          required
                        />
                        <div className="flex justify-between items-center">
                          <p className="text-xs text-muted-foreground">
                            {formData.title.length}/100 ký tự
                          </p>
                          {validationErrors.title && (
                            <p className="text-xs text-red-500">
                              {validationErrors.title}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="grid gap-2">
                        <Label
                          htmlFor="post-meta-description"
                          className="text-sm font-medium"
                        >
                          Meta Description (SEO){" "}
                          <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                          <Textarea
                            id="post-meta-description"
                            placeholder="Mô tả ngắn gọn cho công cụ tìm kiếm (150-160 ký tự)"
                            className={`min-h-[100px] pr-16 resize-none ${
                              validationErrors.meta_description
                                ? "border-red-500 focus:border-red-500"
                                : ""
                            }`}
                            value={formData.meta_description}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value.length <= 300) {
                                setFormData((prev) => ({
                                  ...prev,
                                  meta_description: value,
                                }));
                                validateField("meta_description", value);
                              }
                            }}
                            required
                          />
                          <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
                            {formData.meta_description.length}/300
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex gap-2 text-xs">
                            <span
                              className={
                                formData.meta_description.length < 120
                                  ? "text-orange-500"
                                  : "text-green-500"
                              }
                            >
                              {formData.meta_description.length < 120
                                ? "⚠️ Nên dài hơn 120 ký tự"
                                : "✓ Độ dài phù hợp"}
                            </span>
                            <span
                              className={
                                formData.meta_description.length > 160
                                  ? "text-red-500"
                                  : "text-muted-foreground"
                              }
                            >
                              {formData.meta_description.length > 160
                                ? "❌ Quá dài"
                                : ""}
                            </span>
                          </div>
                          {validationErrors.meta_description && (
                            <p className="text-xs text-red-500">
                              {validationErrors.meta_description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="grid gap-2">
                          <Label
                            htmlFor="post-category"
                            className="text-sm font-medium"
                          >
                            Danh mục <span className="text-red-500">*</span>
                          </Label>
                          <Select
                            value={formData.category}
                            onValueChange={(value) => {
                              setFormData((prev) => ({
                                ...prev,
                                category: value,
                              }));
                              validateField("category", value);
                            }}
                            required
                          >
                            <SelectTrigger
                              className={`h-12 ${
                                validationErrors.category
                                  ? "border-red-500 focus:border-red-500"
                                  : ""
                              }`}
                            >
                              <SelectValue placeholder="Chọn danh mục bài viết" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Công thức">
                                🍳 Công thức
                              </SelectItem>
                              <SelectItem value="Thực đơn">
                                📋 Thực đơn
                              </SelectItem>
                              <SelectItem value="Hướng dẫn">
                                📖 Hướng dẫn
                              </SelectItem>
                              <SelectItem value="Tin tức">
                                📰 Tin tức
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          {validationErrors.category && (
                            <p className="text-xs text-red-500">
                              {validationErrors.category}
                            </p>
                          )}
                        </div>

                        <div className="grid gap-2">
                          <Label
                            htmlFor="post-tags"
                            className="text-sm font-medium"
                          >
                            Tags <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="post-tags"
                            placeholder="tag1, tag2, tag3 (phân cách bằng dấu phẩy)"
                            value={formData.tags.join(", ")}
                            onChange={(e) => {
                              const tags = e.target.value
                                .split(",")
                                .map((tag) => tag.trim())
                                .filter(Boolean);
                              setFormData((prev) => ({
                                ...prev,
                                tags: tags,
                              }));
                              validateField("tags", tags);
                            }}
                            className={`h-12 ${
                              validationErrors.tags
                                ? "border-red-500 focus:border-red-500"
                                : ""
                            }`}
                            required
                          />
                          <div className="flex justify-between items-center">
                            <div className="flex flex-wrap gap-1">
                              {formData.tags.map((tag, index) => (
                                <Badge
                                  key={index}
                                  variant="secondary"
                                  className="text-xs"
                                >
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                            {validationErrors.tags && (
                              <p className="text-xs text-red-500">
                                {validationErrors.tags}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 pb-2 border-b">
                      <Edit className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-semibold">
                        Nội dung bài viết
                      </h3>
                    </div>

                    <div className="grid gap-4">
                      <div className="border rounded-lg p-4 bg-muted/30">
                        <ReactQuill
                          theme="snow"
                          value={formData.content}
                          onChange={(value) => {
                            setFormData((prev) => ({
                              ...prev,
                              content: value,
                            }));
                            validateField("content", value);
                          }}
                          modules={modules}
                          ref={(el) => {
                            if (el) window.quillRef = el.getEditor();
                          }}
                          className={`bg-white rounded-lg ${
                            validationErrors.content ? "border-red-500" : ""
                          }`}
                          style={{ minHeight: "400px" }}
                        />
                      </div>

                      <div className="flex justify-between items-center">
                        <div className="text-sm text-muted-foreground">
                          💡 Mẹo: Sử dụng nút hình ảnh trong editor để chèn hình
                          vào bài viết
                        </div>
                        {validationErrors.content && (
                          <p className="text-xs text-red-500">
                            {validationErrors.content}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Thumbnail Section */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 pb-2 border-b">
                      <ImageIcon className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-semibold">Ảnh đại diện</h3>
                    </div>

                    <div className="grid gap-4">
                      <Label className="text-sm font-medium">
                        Thumbnail (Ảnh đại diện){" "}
                        <span className="text-red-500">*</span>
                      </Label>

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                      />

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Upload Area */}
                        <div
                          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 group ${
                            validationErrors.thumbnail
                              ? "border-red-500 bg-red-50"
                              : "border-muted-foreground/25 hover:border-primary/50 hover:bg-primary/5"
                          }`}
                          onClick={() => fileInputRef.current?.click()}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.currentTarget.classList.add(
                              "border-primary",
                              "bg-primary/10"
                            );
                          }}
                          onDragLeave={(e) => {
                            e.preventDefault();
                            e.currentTarget.classList.remove(
                              "border-primary",
                              "bg-primary/10"
                            );
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            e.currentTarget.classList.remove(
                              "border-primary",
                              "bg-primary/10"
                            );

                            const files = e.dataTransfer.files;
                            if (files.length > 0) {
                              const file = files[0];
                              if (file.type.startsWith("image/")) {
                                // Validate file size
                                if (file.size > 5 * 1024 * 1024) {
                                  validateField("thumbnail", file);
                                  toast.error(
                                    "Kích thước ảnh không được vượt quá 5MB"
                                  );
                                  return;
                                }
                                setSelectedImage(file);
                                const preview = URL.createObjectURL(file);
                                setImagePreview(preview);
                                validateField("thumbnail", file);
                              }
                            }
                          }}
                        >
                          {imagePreview ? (
                            <div className="space-y-4">
                              <div className="relative inline-block group">
                                <img
                                  src={imagePreview}
                                  alt="Thumbnail preview"
                                  className="w-40 h-40 object-cover rounded-lg mx-auto shadow-md group-hover:scale-105 transition-transform"
                                />
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  className="absolute -top-2 -right-2 h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedImage(null);
                                    setImagePreview("");
                                    validateField("thumbnail", null);
                                    if (fileInputRef.current) {
                                      fileInputRef.current.value = "";
                                    }
                                  }}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                              <div className="space-y-2">
                                <p className="text-sm font-medium text-green-600">
                                  ✓ Ảnh đã được chọn
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Click để thay đổi hoặc kéo thả ảnh mới
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                <Upload className="h-8 w-8 text-primary" />
                              </div>
                              <div className="space-y-2">
                                <p className="text-sm font-medium">
                                  Kéo thả ảnh vào đây hoặc click để chọn
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  PNG, JPG, JPEG, WebP (Tối đa 5MB)
                                </p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Preview Info */}
                        <div className="space-y-4">
                          <div className="bg-muted/50 rounded-lg p-4">
                            <h4 className="font-medium mb-3">
                              📋 Yêu cầu ảnh thumbnail
                            </h4>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                              <li className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                Kích thước đề nghị: 1200x630px
                              </li>
                              <li className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                Tỷ lệ khung hình: 1.91:1
                              </li>
                              <li className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                Dung lượng: &lt; 2MB
                              </li>
                              <li className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                Định dạng: JPG, PNG, WebP
                              </li>
                            </ul>
                          </div>

                          {uploadingImage && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                              <div className="flex items-center gap-3 mb-3">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                                <div>
                                  <p className="text-sm font-medium text-blue-900">
                                    Đang upload ảnh...
                                  </p>
                                  <p className="text-xs text-blue-700">
                                    Vui lòng đợi trong giây lát
                                  </p>
                                </div>
                              </div>
                              <div className="w-full bg-blue-200 rounded-full h-2">
                                <div
                                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${uploadProgress}%` }}
                                ></div>
                              </div>
                              <p className="text-xs text-blue-700 mt-1">
                                {uploadProgress}% hoàn thành
                              </p>
                            </div>
                          )}

                          {selectedImage && !uploadingImage && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                              <div className="flex items-center gap-3">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <div>
                                  <p className="text-sm font-medium text-green-900">
                                    Ảnh đã sẵn sàng
                                  </p>
                                  <p className="text-xs text-green-700">
                                    {(selectedImage.size / 1024 / 1024).toFixed(
                                      2
                                    )}{" "}
                                    MB • {selectedImage.type}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          {validationErrors.thumbnail && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                              <div className="flex items-center gap-3">
                                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                <div>
                                  <p className="text-sm font-medium text-red-900">
                                    Lỗi ảnh
                                  </p>
                                  <p className="text-xs text-red-700">
                                    {validationErrors.thumbnail}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              <DialogFooter className="flex gap-3 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                  disabled={isSubmitting}
                >
                  Hủy
                </Button>
                <div className="flex gap-3">
                  <Button
                    type="submit"
                    variant="outline"
                    onClick={() => {
                      setFormData((prev) => ({ ...prev, status: "draft" }));
                    }}
                    disabled={
                      isSubmitting ||
                      !formData.title ||
                      !formData.category ||
                      !selectedImage
                    }
                    className="min-w-[120px]"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                        Đang lưu...
                      </div>
                    ) : (
                      "💾 Lưu nháp"
                    )}
                  </Button>
                  <Button
                    type="submit"
                    onClick={() => {
                      setFormData((prev) => ({ ...prev, status: "published" }));
                    }}
                    disabled={
                      isSubmitting ||
                      !formData.title ||
                      !formData.category ||
                      !selectedImage
                    }
                    className="min-w-[120px]"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Đang xuất bản...
                      </div>
                    ) : (
                      "🚀 Xuất bản"
                    )}
                  </Button>
                </div>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        {/* blog edit */}
        <Dialog
          open={isEditDialogOpen}
          onOpenChange={(open) => {
            setIsEditDialogOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogContent className="sm:max-w-5xl max-h-[95vh] overflow-y-auto">
            <DialogHeader className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Edit className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <DialogTitle className="text-xl">
                      Chỉnh sửa bài viết
                    </DialogTitle>
                    <DialogDescription className="text-base">
                      Cập nhật thông tin bài viết của bạn
                    </DialogDescription>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant={isPreviewMode ? "default" : "outline"}
                    size="sm"
                    onClick={() => setIsPreviewMode(!isPreviewMode)}
                    className="flex items-center gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    {isPreviewMode ? "Chỉnh sửa" : "Xem trước"}
                  </Button>
                </div>
              </div>
            </DialogHeader>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!isPreviewMode) {
                  submitForm();
                }
              }}
              className="space-y-8"
            >
              {isPreviewMode ? (
                // Preview Mode for Edit
                <div className="space-y-8">
                  <div className="bg-muted/30 rounded-lg p-6">
                    <div className="flex items-center gap-2 pb-4 border-b">
                      <Eye className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-semibold">
                        Xem trước bài viết
                      </h3>
                    </div>

                    <div className="space-y-6">
                      {/* Preview Header */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>
                            ✏️ {formData.category || "Chưa chọn danh mục"}
                          </span>
                          <span>•</span>
                          <span>
                            📅 {new Date().toLocaleDateString("vi-VN")}
                          </span>
                        </div>

                        <h1 className="text-3xl font-bold text-gray-900">
                          {formData.title || "Tiêu đề bài viết"}
                        </h1>

                        <p className="text-lg text-gray-600 leading-relaxed">
                          {formData.meta_description ||
                            "Mô tả meta description sẽ hiển thị ở đây"}
                        </p>

                        {formData.tags.length > 0 && (
                          <div className="flex gap-2 flex-wrap">
                            {formData.tags.map((tag, index) => (
                              <Badge key={index} variant="secondary">
                                #{tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Preview Thumbnail */}
                      {imagePreview && (
                        <div className="flex justify-center">
                          <div className="border border-gray-300 rounded-lg p-2 bg-gray-50 hover:shadow-md transition">
                            <img
                              src={imagePreview}
                              alt="Blog thumbnail"
                              className="w-96 h-56 object-cover rounded-md"
                            />
                          </div>
                        </div>
                      )}

                      {/* Preview Content */}
                      <div className="bg-white rounded-lg border p-6">
                        <div
                          className="ql-editor max-w-none text-gray-800"
                          dangerouslySetInnerHTML={{
                            __html:
                              formData.content ||
                              "<p class='text-muted-foreground italic'>Nội dung bài viết sẽ hiển thị ở đây...</p>",
                          }}
                          style={{
                            padding: 0,
                            border: "none",
                            boxShadow: "none",
                            fontSize: "16px",
                            lineHeight: "1.6",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                // Edit Mode
                <>
                  {/* Basic Information Section */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 pb-2 border-b">
                      <FileText className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-semibold">
                        Thông tin cơ bản
                      </h3>
                    </div>

                    <div className="grid gap-6">
                      <div className="grid gap-2">
                        <Label
                          htmlFor="edit-title"
                          className="text-sm font-medium"
                        >
                          Tiêu đề bài viết{" "}
                          <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="edit-title"
                          placeholder="Nhập tiêu đề hấp dẫn cho bài viết..."
                          value={formData.title}
                          onChange={(e) => {
                            const value = e.target.value;
                            setFormData((prev) => ({
                              ...prev,
                              title: value,
                            }));
                            validateField("title", value);
                          }}
                          className={`text-lg h-12 ${
                            validationErrors.title
                              ? "border-red-500 focus:border-red-500"
                              : ""
                          }`}
                          required
                        />
                        <div className="flex justify-between items-center">
                          <p className="text-xs text-muted-foreground">
                            {formData.title.length}/100 ký tự
                          </p>
                          {validationErrors.title && (
                            <p className="text-xs text-red-500">
                              {validationErrors.title}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="grid gap-2">
                        <Label
                          htmlFor="edit-meta-description"
                          className="text-sm font-medium"
                        >
                          Meta Description (SEO)
                        </Label>
                        <div className="relative">
                          <Textarea
                            id="edit-meta-description"
                            placeholder="Mô tả ngắn gọn cho công cụ tìm kiếm (150-160 ký tự)"
                            className={`min-h-[100px] pr-16 resize-none ${
                              validationErrors.meta_description
                                ? "border-red-500 focus:border-red-500"
                                : ""
                            }`}
                            value={formData.meta_description}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value.length <= 460) {
                                setFormData((prev) => ({
                                  ...prev,
                                  meta_description: value,
                                }));
                                validateField("meta_description", value);
                              }
                            }}
                          />
                          <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
                            {formData.meta_description.length}/160
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex gap-2 text-xs">
                            <span
                              className={
                                formData.meta_description.length < 120
                                  ? "text-orange-500"
                                  : "text-green-500"
                              }
                            >
                              {formData.meta_description.length < 120
                                ? "⚠️ Nên dài hơn 120 ký tự"
                                : "✓ Độ dài phù hợp"}
                            </span>
                            <span
                              className={
                                formData.meta_description.length > 160
                                  ? "text-red-500"
                                  : "text-muted-foreground"
                              }
                            >
                              {formData.meta_description.length > 160
                                ? "❌ Quá dài"
                                : ""}
                            </span>
                          </div>
                          {validationErrors.meta_description && (
                            <p className="text-xs text-red-500">
                              {validationErrors.meta_description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="grid gap-2">
                          <Label
                            htmlFor="edit-category"
                            className="text-sm font-medium"
                          >
                            Danh mục <span className="text-red-500">*</span>
                          </Label>
                          <Select
                            value={formData.category}
                            onValueChange={(value) => {
                              setFormData((prev) => ({
                                ...prev,
                                category: value,
                              }));
                              validateField("category", value);
                            }}
                            required
                          >
                            <SelectTrigger
                              className={`h-12 ${
                                validationErrors.category
                                  ? "border-red-500 focus:border-red-500"
                                  : ""
                              }`}
                            >
                              <SelectValue placeholder="Chọn danh mục bài viết" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Công thức">
                                🍳 Công thức
                              </SelectItem>
                              <SelectItem value="Thực đơn">
                                📋 Thực đơn
                              </SelectItem>
                              <SelectItem value="Hướng dẫn">
                                📖 Hướng dẫn
                              </SelectItem>
                              <SelectItem value="Tin tức">
                                📰 Tin tức
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          {validationErrors.category && (
                            <p className="text-xs text-red-500">
                              {validationErrors.category}
                            </p>
                          )}
                        </div>

                        <div className="grid gap-2">
                          <Label
                            htmlFor="edit-tags"
                            className="text-sm font-medium"
                          >
                            Tags
                          </Label>
                          <Input
                            id="edit-tags"
                            placeholder="tag1, tag2, tag3 (phân cách bằng dấu phẩy)"
                            value={formData.tags.join(", ")}
                            onChange={(e) => {
                              const tags = e.target.value
                                .split(",")
                                .map((tag) => tag.trim())
                                .filter(Boolean);
                              setFormData((prev) => ({
                                ...prev,
                                tags: tags,
                              }));
                              validateField("tags", tags);
                            }}
                            className={`h-12 ${
                              validationErrors.tags
                                ? "border-red-500 focus:border-red-500"
                                : ""
                            }`}
                          />
                          <div className="flex justify-between items-center">
                            <div className="flex flex-wrap gap-1">
                              {formData.tags.map((tag, index) => (
                                <Badge
                                  key={index}
                                  variant="secondary"
                                  className="text-xs"
                                >
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                            {validationErrors.tags && (
                              <p className="text-xs text-red-500">
                                {validationErrors.tags}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 pb-2 border-b">
                      <Edit className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-semibold">
                        Nội dung bài viết
                      </h3>
                    </div>

                    <div className="grid gap-4">
                      <div className="border rounded-lg p-4 bg-muted/30">
                        <ReactQuill
                          theme="snow"
                          value={formData.content}
                          onChange={(value) => {
                            setFormData((prev) => ({
                              ...prev,
                              content: value,
                            }));
                            validateField("content", value);
                          }}
                          modules={modules}
                          ref={(el) => {
                            if (el) window.quillRef = el.getEditor();
                          }}
                          className={`bg-white rounded-lg ${
                            validationErrors.content ? "border-red-500" : ""
                          }`}
                          style={{ minHeight: "400px" }}
                        />
                      </div>

                      <div className="flex justify-between items-center">
                        <div className="text-sm text-muted-foreground">
                          💡 Mẹo: Sử dụng nút hình ảnh trong editor để chèn hình
                          vào bài viết
                        </div>
                        {validationErrors.content && (
                          <p className="text-xs text-red-500">
                            {validationErrors.content}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Thumbnail Section */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 pb-2 border-b">
                      <ImageIcon className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-semibold">Ảnh đại diện</h3>
                    </div>

                    <div className="grid gap-4">
                      <Label className="text-sm font-medium">
                        Thumbnail (Ảnh đại diện)
                      </Label>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                      />
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Upload Area */}
                        <div
                          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 group ${
                            validationErrors.thumbnail
                              ? "border-red-500 bg-red-50"
                              : "border-muted-foreground/25 hover:border-primary/50 hover:bg-primary/5"
                          }`}
                          onClick={() => fileInputRef.current?.click()}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.currentTarget.classList.add(
                              "border-primary",
                              "bg-primary/10"
                            );
                          }}
                          onDragLeave={(e) => {
                            e.preventDefault();
                            e.currentTarget.classList.remove(
                              "border-primary",
                              "bg-primary/10"
                            );
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            e.currentTarget.classList.remove(
                              "border-primary",
                              "bg-primary/10"
                            );

                            const files = e.dataTransfer.files;
                            if (files.length > 0) {
                              const file = files[0];
                              if (file.type.startsWith("image/")) {
                                // Validate file size
                                if (file.size > 5 * 1024 * 1024) {
                                  validateField("thumbnail", file);
                                  toast.error(
                                    "Kích thước ảnh không được vượt quá 5MB"
                                  );
                                  return;
                                }
                                setSelectedImage(file);
                                const preview = URL.createObjectURL(file);
                                setImagePreview(preview);
                                validateField("thumbnail", file);
                              }
                            }
                          }}
                        >
                          {imagePreview ? (
                            <div className="space-y-4">
                              <div className="relative inline-block group">
                                <img
                                  src={imagePreview}
                                  alt="Thumbnail preview"
                                  className="w-40 h-40 object-cover rounded-lg mx-auto shadow-md group-hover:scale-105 transition-transform"
                                />
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  className="absolute -top-2 -right-2 h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedImage(null);
                                    setImagePreview("");
                                    validateField("thumbnail", null);
                                    if (fileInputRef.current) {
                                      fileInputRef.current.value = "";
                                    }
                                  }}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                              <div className="space-y-2">
                                <p className="text-sm font-medium text-green-600">
                                  ✓ Ảnh đã được chọn
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Click để thay đổi hoặc kéo thả ảnh mới
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                <Upload className="h-8 w-8 text-primary" />
                              </div>
                              <div className="space-y-2">
                                <p className="text-sm font-medium">
                                  Kéo thả ảnh vào đây hoặc click để chọn
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  PNG, JPG, JPEG, WebP (Tối đa 5MB)
                                </p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Preview Info */}
                        <div className="space-y-4">
                          <div className="bg-muted/50 rounded-lg p-4">
                            <h4 className="font-medium mb-3">
                              📋 Yêu cầu ảnh thumbnail
                            </h4>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                              <li className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                Kích thước đề nghị: 1200x630px
                              </li>
                              <li className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                Tỷ lệ khung hình: 1.91:1
                              </li>
                              <li className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                Dung lượng: &lt; 2MB
                              </li>
                              <li className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                Định dạng: JPG, PNG, WebP
                              </li>
                            </ul>
                          </div>

                          {uploadingImage && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                              <div className="flex items-center gap-3 mb-3">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                                <div>
                                  <p className="text-sm font-medium text-blue-900">
                                    Đang upload ảnh...
                                  </p>
                                  <p className="text-xs text-blue-700">
                                    Vui lòng đợi trong giây lát
                                  </p>
                                </div>
                              </div>
                              <div className="w-full bg-blue-200 rounded-full h-2">
                                <div
                                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${uploadProgress}%` }}
                                ></div>
                              </div>
                              <p className="text-xs text-blue-700 mt-1">
                                {uploadProgress}% hoàn thành
                              </p>
                            </div>
                          )}

                          {selectedImage && !uploadingImage && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                              <div className="flex items-center gap-3">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <div>
                                  <p className="text-sm font-medium text-green-900">
                                    Ảnh đã sẵn sàng
                                  </p>
                                  <p className="text-xs text-green-700">
                                    {(selectedImage.size / 1024 / 1024).toFixed(
                                      2
                                    )}{" "}
                                    MB • {selectedImage.type}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          {validationErrors.thumbnail && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                              <div className="flex items-center gap-3">
                                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                <div>
                                  <p className="text-sm font-medium text-red-900">
                                    Lỗi ảnh
                                  </p>
                                  <p className="text-xs text-red-700">
                                    {validationErrors.thumbnail}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              <DialogFooter className="flex gap-3 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                  disabled={isSubmitting}
                  className="flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Hủy
                </Button>
                <div className="flex gap-3">
                  <Button
                    type="submit"
                    variant="outline"
                    onClick={() => {
                      setFormData((prev) => ({ ...prev, status: "draft" }));
                    }}
                    disabled={isSubmitting}
                    className="min-w-[120px] flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                        Đang lưu...
                      </div>
                    ) : (
                      <>
                        <FileText className="h-4 w-4" />
                        💾 Lưu nháp
                      </>
                    )}
                  </Button>
                  <Button
                    type="submit"
                    onClick={() => {
                      setFormData((prev) => ({ ...prev, status: "published" }));
                    }}
                    disabled={isSubmitting}
                    className="min-w-[120px] flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Đang xuất bản...
                      </div>
                    ) : (
                      <>
                        <Globe className="h-4 w-4" />
                        🚀 Xuất bản
                      </>
                    )}
                  </Button>
                </div>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      {/* Blog Posts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách bài viết</CardTitle>
          <CardDescription>
            Quản lý tất cả bài viết blog ({filteredPosts.length} bài viết)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                <span className="text-sm text-muted-foreground">
                  Đang tải...
                </span>
              </div>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">
                Không có bài viết nào
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchTerm ||
                categoryFilter !== "all" ||
                statusFilter !== "all"
                  ? "Không tìm thấy bài viết nào phù hợp với bộ lọc hiện tại."
                  : "Chưa có bài viết nào được tạo."}
              </p>
              {(searchTerm ||
                categoryFilter !== "all" ||
                statusFilter !== "all") && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("");
                    setCategoryFilter("all");
                    setStatusFilter("all");
                  }}
                >
                  Xóa bộ lọc
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tác giả</TableHead>
                  <TableHead>Ảnh</TableHead>
                  <TableHead>Tiêu đề</TableHead>
                  <TableHead>Danh mục</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPosts.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {post.author?.face_image_url ? (
                          <img
                            src={post.author.face_image_url}
                            alt={post.author?.username ?? "Avatar"}
                            loading="lazy"
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold text-gray-700">
                            {getInitials(post.author?.username)}
                          </div>
                        )}

                        <span className="text-sm font-medium">
                          {post.author?.username ?? "Khách vãng lai"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {post.thumbnail_url ? (
                        <img
                          src={post.thumbnail_url}
                          alt="Thumbnail"
                          className="w-12 h-12 object-cover rounded-md"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 rounded-md flex items-center justify-center">
                          <ImageIcon className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                    </TableCell>

                    <TableCell className="max-w-[250px]">
                      <div>
                        <p className="font-medium truncate">{post.title}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{post.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {getStatusBadge(post.status || "draft")}
                        <Select
                          value={post.status}
                          onValueChange={(value) =>
                            updatePostStatus(post.id, value)
                          }
                        >
                          <SelectTrigger className="w-32 h-6 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="draft">Nháp</SelectItem>
                            <SelectItem value="published">Xuất bản</SelectItem>
                            <SelectItem value="deleted">Lưu trữ</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                    <TableCell>
                      {post.created_at
                        ? new Date(post.created_at).toLocaleString("vi-VN", {
                            hour12: false, // hiển thị dạng 24h
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })
                        : "Chưa xác định"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end  gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedPost(post);
                            setIsViewDialogOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(post)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeletePost(post.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      {/* view blog Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-5xl max-h-[95vh] overflow-y-auto">
          <DialogHeader className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4 flex-1">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <Eye className="h-7 w-7 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <DialogTitle className="text-2xl font-bold text-gray-900 leading-tight pr-8">
                    {selectedPost?.title}
                  </DialogTitle>
                  <DialogDescription className="text-base mt-2 flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {selectedPost?.author?.username || "Khách vãng lai"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FolderOpen className="h-4 w-4 text-muted-foreground" />
                      <Badge variant="outline" className="font-medium">
                        {selectedPost?.category}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {selectedPost?.created_at &&
                          new Date(selectedPost.created_at).toLocaleDateString(
                            "vi-VN"
                          )}
                      </span>
                    </div>
                  </DialogDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(selectedPost?.status || "draft")}
              </div>
            </div>
          </DialogHeader>

          {selectedPost && (
            <div className="space-y-8">
              {/* Thumbnail Section */}
              {selectedPost.thumbnail_url && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b">
                    <ImageIcon className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">Ảnh đại diện</h3>
                  </div>
                  <div className="flex justify-center">
                    <div className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <img
                        src={selectedPost.thumbnail_url}
                        alt="Blog thumbnail"
                        className="w-full max-w-2xl h-64 object-cover rounded-xl shadow-lg group-hover:shadow-xl transition-shadow duration-300"
                      />
                      <div className="absolute bottom-4 left-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <p className="text-sm font-medium">
                          Thumbnail bài viết
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Meta Information Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <Info className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Thông tin SEO</h3>
                </div>

                <div className="grid gap-4">
                  <div className="bg-muted/30 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Search className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <h4 className="font-medium mb-2">Meta Description</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {selectedPost.meta_description || (
                            <span className="italic text-muted-foreground/70">
                              Không có meta description
                            </span>
                          )}
                        </p>
                        {selectedPost.meta_description && (
                          <div className="mt-2 text-xs text-muted-foreground">
                            {selectedPost.meta_description.length}/160 ký tự
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Content Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <FileText className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Nội dung bài viết</h3>
                </div>

                <div className="bg-white rounded-lg border p-6 shadow-sm">
                  <div
                    className="ql-editor max-w-none text-gray-800 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: selectedPost.content }}
                    style={{
                      padding: 0,
                      border: "none",
                      boxShadow: "none",
                      fontSize: "16px",
                      lineHeight: "1.6",
                    }}
                  />
                </div>
              </div>

              {/* Tags Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <Tag className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Tags</h3>
                </div>

                <div className="bg-muted/30 rounded-lg p-4">
                  {selectedPost.tags &&
                  Array.isArray(selectedPost.tags) &&
                  selectedPost.tags.length > 0 ? (
                    <div className="flex gap-2 flex-wrap">
                      {selectedPost.tags.map((tag, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="px-3 py-1 text-sm font-medium hover:bg-primary/10 transition-colors"
                        >
                          <Tag className="h-3 w-3 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Tag className="h-4 w-4" />
                      <span className="text-sm italic">Không có tags</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Timestamps Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <Clock className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Thời gian</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-muted/30 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Calendar className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Ngày tạo
                        </p>
                        <p className="text-sm font-semibold">
                          {selectedPost.created_at &&
                            new Date(selectedPost.created_at).toLocaleString(
                              "vi-VN",
                              {
                                weekday: "long",
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                        </p>
                      </div>
                    </div>
                  </div>

                  {selectedPost.published_at && (
                    <div className="bg-muted/30 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <Globe className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            Ngày xuất bản
                          </p>
                          <p className="text-sm font-semibold">
                            {new Date(selectedPost.published_at).toLocaleString(
                              "vi-VN",
                              {
                                weekday: "long",
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-3 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsViewDialogOpen(false)}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Đóng
            </Button>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsViewDialogOpen(false);
                  openEditDialog(selectedPost!);
                }}
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Chỉnh sửa
              </Button>
              <Button
                type="button"
                onClick={() => {
                  // Open in new tab or navigate to blog post
                  if (selectedPost?.id) {
                    window.open(`/blog/${selectedPost.id}`, "_blank");
                  }
                }}
                className="flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Xem trên website
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
