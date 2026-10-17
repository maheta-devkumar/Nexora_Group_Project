import api from "./api";

const MEDIA_BASE_URL = "/media";

// Upload product image
export const uploadImage = async (variantId, file) => {
  try {
    const formData = new FormData();
    formData.append("file", file);
    
    // Try different endpoint formats
    const response = await api.post(`${MEDIA_BASE_URL}/upload/image`, formData, {
      params: { variant_id: variantId },
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    
    return {
      success: true,
      data: response.data,
      message: response.data.message || "Image uploaded successfully",
    };
  } catch (error) {
    console.error("Image upload error:", error.response?.data || error.message);
    return {
      success: false,
      message: error.response?.data?.detail || error.response?.data?.message || "Failed to upload image",
      data: null,
    };
  }
};

// Delete product image
export const deleteImage = async (imageId) => {
  try {
    // Try different endpoint formats
    const response = await api.delete(`${MEDIA_BASE_URL}/image/${imageId}`);
    
    return {
      success: true,
      data: response.data,
      message: response.data.message || "Image deleted successfully",
    };
  } catch (error) {
    console.error("Image delete error:", error.response?.data || error.message);
    return {
      success: false,
      message: error.response?.data?.detail || error.response?.data?.message || "Failed to delete image",
      data: null,
    };
  }
};

// Set default image
export const setDefaultImage = async (variantId, imageId) => {
  try {
    // Try different endpoint formats
    const response = await api.put(`${MEDIA_BASE_URL}/image/${imageId}/default`, null, {
      params: { variant_id: variantId },
    });
    
    return {
      success: true,
      data: response.data,
      message: response.data.message || "Default image set successfully",
    };
  } catch (error) {
    console.error("Set default error:", error.response?.data || error.message);
    return {
      success: false,
      message: error.response?.data?.detail || error.response?.data?.message || "Failed to set default image",
      data: null,
    };
  }
};

// Upload product video
export const uploadVideo = async (variantId, file) => {
  try {
    const formData = new FormData();
    formData.append("file", file);
    
    const response = await api.post(`${MEDIA_BASE_URL}/upload/video`, formData, {
      params: { variant_id: variantId },
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    
    return {
      success: true,
      data: response.data,
      message: response.data.message || "Video uploaded successfully",
    };
  } catch (error) {
    console.error("Video upload error:", error.response?.data || error.message);
    return {
      success: false,
      message: error.response?.data?.detail || error.response?.data?.message || "Failed to upload video",
      data: null,
    };
  }
};

// Delete product video
export const deleteVideo = async (videoId) => {
  try {
    const response = await api.delete(`${MEDIA_BASE_URL}/video/${videoId}`);
    
    return {
      success: true,
      data: response.data,
      message: response.data.message || "Video deleted successfully",
    };
  } catch (error) {
    console.error("Video delete error:", error.response?.data || error.message);
    return {
      success: false,
      message: error.response?.data?.detail || error.response?.data?.message || "Failed to delete video",
      data: null,
    };
  }
};

// Fetch images for a variant
export const fetchVariantImages = async (variantId) => {
  try {
    // Try different endpoint formats
    const response = await api.get(`${MEDIA_BASE_URL}/variant/${variantId}/images`);
    // OR: const response = await api.get(`/variants/${variantId}/images`);
    
    return {
      success: true,
      data: response.data.images || response.data.data || response.data,
      message: response.data.message || "Images fetched successfully",
    };
  } catch (error) {
    console.error("Fetch images error:", error.response?.data || error.message);
    return {
      success: false,
      message: error.response?.data?.detail || error.response?.data?.message || "Failed to fetch images",
      data: [],
    };
  }
};

// Fetch videos for a variant
export const fetchVariantVideos = async (variantId) => {
  try {
    const response = await api.get(`${MEDIA_BASE_URL}/variant/${variantId}/videos`);
    // OR: const response = await api.get(`/variants/${variantId}/videos`);
    
    return {
      success: true,
      data: response.data.videos || response.data.data || response.data,
      message: response.data.message || "Videos fetched successfully",
    };
  } catch (error) {
    console.error("Fetch videos error:", error.response?.data || error.message);
    return {
      success: false,
      message: error.response?.data?.detail || error.response?.data?.message || "Failed to fetch videos",
      data: [],
    };
  }
};