import React, { createContext, useState, useContext, useCallback } from "react";
import * as mediaApi from "../api/media";

const MediaContext = createContext();

export const useMedia = () => {
  const context = useContext(MediaContext);
  if (!context) {
    throw new Error("useMedia must be used within a MediaProvider");
  }
  return context;
};

export const MediaProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [media, setMedia] = useState({
    images: [],
    videos: [],
  });

  // Fetch media for variant
  const fetchVariantMedia = useCallback(async (variantId) => {
    setLoading(true);
    setError(null);
    try {
      // Use the mediaApi for media operations
      const result = await mediaApi.fetchVariantMedia(variantId);
      
      if (result.success) {
        setMedia(result.data || { images: [], videos: [] });
        return result;
      } else {
        setError(result.message);
        return { success: false, message: result.message };
      }
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || "Failed to fetch media";
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  // Upload image
  const uploadImage = useCallback(async (variantId, file) => {
    setLoading(true);
    setError(null);
    try {
      const result = await mediaApi.uploadImage(variantId, file);
      
      if (result.success) {
        // Refresh media list
        await fetchVariantMedia(variantId);
        return result;
      } else {
        setError(result.message);
        return { success: false, message: result.message };
      }
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || "Failed to upload image";
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  }, [fetchVariantMedia]);

  // Delete image
  const deleteImage = useCallback(async (imageId) => {
    setLoading(true);
    setError(null);
    try {
      const result = await mediaApi.deleteImage(imageId);
      
      if (result.success) {
        // Note: We don't update local state here because we'll refresh
        return result;
      } else {
        setError(result.message);
        return { success: false, message: result.message };
      }
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || "Failed to delete image";
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  // Set default image
  const setDefaultImage = useCallback(async (variantId, imageId) => {
    setLoading(true);
    setError(null);
    try {
      const result = await mediaApi.setDefaultImage(variantId, imageId);
      
      if (result.success) {
        return result;
      } else {
        setError(result.message);
        return { success: false, message: result.message };
      }
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || "Failed to set default image";
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  // Upload video
  const uploadVideo = useCallback(async (variantId, file) => {
    setLoading(true);
    setError(null);
    try {
      const result = await mediaApi.uploadVideo(variantId, file);
      
      if (result.success) {
        // Refresh media list
        await fetchVariantMedia(variantId);
        return result;
      } else {
        setError(result.message);
        return { success: false, message: result.message };
      }
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || "Failed to upload video";
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  }, [fetchVariantMedia]);

  // Delete video
  const deleteVideo = useCallback(async (videoId) => {
    setLoading(true);
    setError(null);
    try {
      const result = await mediaApi.deleteVideo(videoId);
      
      if (result.success) {
        return result;
      } else {
        setError(result.message);
        return { success: false, message: result.message };
      }
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || "Failed to delete video";
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value = {
    loading,
    error,
    media,
    
    fetchVariantMedia,
    uploadImage,
    deleteImage,
    setDefaultImage,
    uploadVideo,
    deleteVideo,
    clearError,
  };

  return (
    <MediaContext.Provider value={value}>
      {children}
    </MediaContext.Provider>
  );
};