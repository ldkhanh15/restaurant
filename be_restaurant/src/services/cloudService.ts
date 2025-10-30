import { v2 as cloudinary } from 'cloudinary'
import fs from 'fs'

// ⚙️ Cấu hình Cloudinary SDK (chỉ làm 1 lần)
cloudinary.config({
  cloud_name: 'dsudwzjut',
  api_key: '949799532858167',
  api_secret: 'uEKiSoVdWkdwuXs4LYWOkqz-WcM',
})

export default cloudinary

// ======================== UPLOAD 1 ẢNH ========================
export async function uploadImageToCloudinary(
  filePath: string,
  param: string
): Promise<{ secure_url: string; public_id: string }> {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: `pb6/${param}`,
    })

    // Xóa file tạm sau khi upload xong (nếu bạn dùng multer)
    fs.unlinkSync(filePath)

    return {
      secure_url: result.secure_url,
      public_id: result.public_id,
    }
  } catch (error) {
    console.error('Upload to Cloudinary failed:', error)
    throw error
  }
}

// ======================== UPLOAD NHIỀU ẢNH ========================
export async function uploadMultipleImagesToCloudinary(
  filePaths: string[],
  param: string
): Promise<{ secure_url: string; public_id: string }[]> {
  const results = []
  for (const path of filePaths) {
    const uploaded = await uploadImageToCloudinary(path, param)
    results.push(uploaded)
  }
  return results
}

// ======================== XÓA ẢNH ========================
export async function deleteImageFromCloudinary(publicId: string): Promise<void> {
  try {
    const result = await cloudinary.uploader.destroy(publicId)
    console.log('Deleted from Cloudinary:', result)
  } catch (error) {
    console.error('Failed to delete image:', error)
  }
}

// ======================== UPDATE ẢNH ========================
export async function updateImageInCloudinary(
  newFilePath: string,
  oldPublicId: string | null,
  param: string
): Promise<{ secure_url: string; public_id: string }> {
  try {
    // 1️⃣ Nếu có ảnh cũ -> xóa trước
    if (oldPublicId) {
      await deleteImageFromCloudinary(oldPublicId)
    }

    // 2️⃣ Upload ảnh mới
    const uploaded = await uploadImageToCloudinary(newFilePath, param)
    return uploaded
  } catch (error) {
    console.error('Error updating image:', error)
    throw error
  }
}