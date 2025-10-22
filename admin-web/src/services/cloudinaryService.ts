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