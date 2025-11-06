/**
 * Upload image to Cloudinary
 * @param {File} file - Image file to upload
 * @param {string} publicId - Public ID for the image
 * @returns {Promise<string>} - Cloudinary secure URL
 */
export async function uploadImageToCloudinary(file, publicId) {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
  const folder = import.meta.env.VITE_CLOUDINARY_FOLDER || 'avatars';

  if (!cloudName || !uploadPreset) {
    throw new Error('Cloudinary configuration is missing');
  }

  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  if (!validTypes.includes(file.type)) {
    throw new Error('نوع الملف غير مدعوم. يرجى اختيار صورة بصيغة JPG أو PNG أو WEBP');
  }

  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    throw new Error('حجم الملف كبير جداً. الحد الأقصى 5 ميجابايت');
  }

  const resizedFile = await resizeImage(file, 256, 256);

  const formData = new FormData();
  formData.append('file', resizedFile);
  formData.append('upload_preset', uploadPreset);
  formData.append('folder', folder);
  formData.append('public_id', publicId);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error('فشل رفع الصورة. يرجى المحاولة مرة أخرى');
    }

    const data = await response.json();
    return data.secure_url;
  } catch (error) {
    console.error('Upload error:', error);
    throw new Error('حدث خطأ أثناء رفع الصورة. يرجى التحقق من الاتصال بالإنترنت');
  }
}

/**
 * Upload banner image to Cloudinary (no resize)
 * @param {File} file - Banner image file to upload
 * @param {string} publicId - Public ID for the banner
 * @returns {Promise<{secureUrl: string, publicId: string}>} - Cloudinary URLs
 */
export async function uploadBannerImage(file, publicId) {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
  const folder = import.meta.env.VITE_CLOUDINARY_BANNERS_FOLDER || 'banners';

  if (!cloudName || !uploadPreset) {
    throw new Error('Cloudinary configuration is missing');
  }

  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  if (!validTypes.includes(file.type)) {
    throw new Error('نوع الملف غير مدعوم. يرجى اختيار صورة بصيغة JPG أو PNG أو WEBP');
  }

  const maxSize = 15 * 1024 * 1024; // 15MB for banners
  if (file.size > maxSize) {
    throw new Error('حجم الملف كبير جداً. الحد الأقصى 15 ميجابايت');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);
  formData.append('folder', folder);
  formData.append('public_id', publicId);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error('فشل رفع الصورة. يرجى المحاولة مرة أخرى');
    }

    const data = await response.json();
    return {
      secureUrl: data.secure_url,
      publicId: data.public_id
    };
  } catch (error) {
    console.error('Upload error:', error);
    throw new Error('حدث خطأ أثناء رفع الصورة. يرجى التحقق من الاتصال بالإنترنت');
  }
}

/**
 * Resize image to specified dimensions
 * @param {File} file - Image file to resize
 * @param {number} maxWidth - Maximum width
 * @param {number} maxHeight - Maximum height
 * @returns {Promise<Blob>} - Resized image blob
 */
function resizeImage(file, maxWidth, maxHeight) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        const size = Math.min(width, height);
        const x = (width - size) / 2;
        const y = (height - size) / 2;

        canvas.width = maxWidth;
        canvas.height = maxHeight;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, x, y, size, size, 0, 0, maxWidth, maxHeight);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('فشل معالجة الصورة'));
            }
          },
          'image/jpeg',
          0.85
        );
      };
      img.onerror = () => reject(new Error('فشل تحميل الصورة'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('فشل قراءة الملف'));
    reader.readAsDataURL(file);
  });
}
