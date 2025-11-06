import { toast } from "react-toastify"

export async function uploadImageToCloudinary(file: File, param:string): Promise<string> {
  const formData = new FormData()
  formData.append("file", file)
  formData.append("upload_preset", `pbl6_CNPM_${param}`)
  formData.append("folder", `pb6/${param}`)

  const response = await fetch("https://api.cloudinary.com/v1_1/dsudwzjut/image/upload", {
    method: "POST",
    body: formData,
  })

  if (!response.ok) {
    console.log(response)
    toast.error("Upload ảnh thất bại")
  }

  const data = await response.json()
  return data.secure_url
}

export async function uploadMultipleImagesToCloudinary(files: File[], param: string): Promise<string[]> {
  if (!files?.length) return []
  const uploadPromises = files.map((file) => uploadImageToCloudinary(file, param))
  const urls = await Promise.all(uploadPromises)
  return urls;
}

export async function deleteImageFromCloudinary(imageUrl: string): Promise<boolean> {
  try {
    // Extract public_id from Cloudinary URL
    // URL format: https://res.cloudinary.com/{cloud_name}/image/upload/{folder}/{public_id}.{format}
    const urlParts = imageUrl.split('/')
    const publicIdWithExtension = urlParts[urlParts.length - 1]
    const publicId = `pb6/${publicIdWithExtension.split('.')[0]}`

    const response = await fetch(`https://api.cloudinary.com/v1_1/dsudwzjut/image/destroy`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        public_id: publicId,
        api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
        api_secret: process.env.NEXT_PUBLIC_CLOUDINARY_API_SECRET,
        timestamp: Math.floor(Date.now() / 1000),
      }),
    })

    if (!response.ok) {
      console.error("Failed to delete image from Cloudinary:", response)
      return false
    }

    const data = await response.json()
    return data.result === "ok"
  } catch (error) {
    console.error("Error deleting image from Cloudinary:", error)
    return false
  }
}

export async function deleteMultipleImagesFromCloudinary(imageUrls: string[]): Promise<boolean[]> {
  if (!imageUrls?.length) return []

  const deletePromises = imageUrls.map((url) => deleteImageFromCloudinary(url))
  const results = await Promise.all(deletePromises)
  return results
}