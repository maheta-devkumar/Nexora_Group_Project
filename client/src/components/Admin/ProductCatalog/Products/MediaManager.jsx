import React, { useEffect, useState } from 'react';
import { useVariant } from '../../../../context/VariantContext';
import { useMedia } from '../../../../context/MediaContext';
import './MediaManager.css';

const MediaManager = ({ variantId }) => {
    // Use VariantContext for fetching media
    const {
        fetchVariantImages,
        fetchVariantVideos,
        loading: variantLoading,
        error: variantError,
        clearError: clearVariantError
    } = useVariant();

    // Use MediaContext for upload/delete operations
    const {
        uploadImage,
        deleteImage,
        setDefaultImage,
        uploadVideo,
        deleteVideo,
        loading: mediaLoading,
        error: mediaError,
        clearError: clearMediaError
    } = useMedia();

    const [activeTab, setActiveTab] = useState('images');
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadType, setUploadType] = useState(''); // 'image' or 'video'
    const [images, setImages] = useState([]);
    const [videos, setVideos] = useState([]);

    // Fetch images when tab changes or variantId changes
    useEffect(() => {
        const fetchMedia = async () => {
            if (!variantId) return;

            try {
                if (activeTab === 'images') {
                    const result = await fetchVariantImages(variantId);
                    if (result.success) {
                        setImages(result.data || []);
                    }
                } else {
                    const result = await fetchVariantVideos(variantId);
                    if (result.success) {
                        setVideos(result.data || []);
                    }
                }
            } catch (error) {
                console.error('Error fetching media:', error);
            }
        };

        fetchMedia();
    }, [variantId, activeTab, fetchVariantImages, fetchVariantVideos]);

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert('Please select an image file (JPEG, PNG, GIF, etc.)');
            return;
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            alert('Image size should be less than 5MB');
            return;
        }

        setUploading(true);
        setUploadType('image');
        setUploadProgress(0);

        try {
            // Simulate upload progress
            const progressInterval = setInterval(() => {
                setUploadProgress(prev => {
                    if (prev >= 90) {
                        clearInterval(progressInterval);
                        return 90;
                    }
                    return prev + 10;
                });
            }, 100);

            const result = await uploadImage(variantId, file);

            clearInterval(progressInterval);
            setUploadProgress(100);

            if (result && result.success) {
                console.log('Image uploaded successfully:', result.data);
                // Refresh images list
                const fetchResult = await fetchVariantImages(variantId);
                if (fetchResult.success) {
                    setImages(fetchResult.data || []);
                }
                // Reset file input
                e.target.value = '';
            } else {
                console.error('Image upload failed:', result?.message);
            }
        } catch (err) {
            console.error('Image upload error:', err);
            alert('Failed to upload image. Please try again.');
        } finally {
            setTimeout(() => {
                setUploading(false);
                setUploadProgress(0);
                setUploadType('');
            }, 500);
        }
    };

    const handleVideoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('video/')) {
            alert('Please select a video file (MP4, AVI, MOV, etc.)');
            return;
        }

        if (file.size > 50 * 1024 * 1024) { // 50MB limit
            alert('Video size should be less than 50MB');
            return;
        }

        setUploading(true);
        setUploadType('video');
        setUploadProgress(0);

        try {
            // Simulate upload progress
            const progressInterval = setInterval(() => {
                setUploadProgress(prev => {
                    if (prev >= 90) {
                        clearInterval(progressInterval);
                        return 90;
                    }
                    return prev + 10;
                });
            }, 100);

            const result = await uploadVideo(variantId, file);

            clearInterval(progressInterval);
            setUploadProgress(100);

            if (result && result.success) {
                console.log('Video uploaded successfully:', result.data);
                // Refresh videos list
                const fetchResult = await fetchVariantVideos(variantId);
                if (fetchResult.success) {
                    setVideos(fetchResult.data || []);
                }
                // Reset file input
                e.target.value = '';
            } else {
                console.error('Video upload failed:', result?.message);
            }
        } catch (err) {
            console.error('Video upload error:', err);
            alert('Failed to upload video. Please try again.');
        } finally {
            setTimeout(() => {
                setUploading(false);
                setUploadProgress(0);
                setUploadType('');
            }, 500);
        }
    };

    const handleDeleteImage = async (imageId, imageName) => {
        if (window.confirm(`Are you sure you want to delete "${imageName || 'this image'}"?`)) {
            const result = await deleteImage(imageId);
            if (result && result.success) {
                console.log('Image deleted successfully');
                // Refresh images list
                const fetchResult = await fetchVariantImages(variantId);
                if (fetchResult.success) {
                    setImages(fetchResult.data || []);
                }
            }
        }
    };

    const handleDeleteVideo = async (videoId, videoName) => {
        if (window.confirm(`Are you sure you want to delete "${videoName || 'this video'}"?`)) {
            const result = await deleteVideo(videoId);
            if (result && result.success) {
                console.log('Video deleted successfully');
                // Refresh videos list
                const fetchResult = await fetchVariantVideos(variantId);
                if (fetchResult.success) {
                    setVideos(fetchResult.data || []);
                }
            }
        }
    };

    const handleSetDefaultImage = async (imageId) => {
        const result = await setDefaultImage(variantId, imageId);
        if (result && result.success) {
            console.log('Default image set successfully');
            // Refresh images list to update default status
            const fetchResult = await fetchVariantImages(variantId);
            if (fetchResult.success) {
                setImages(fetchResult.data || []);
            }
        }
    };

    const handleDismissError = () => {
        if (variantError) clearVariantError();
        if (mediaError) clearMediaError();
    };

    const getFileSize = (bytes) => {
        if (!bytes) return 'N/A';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString();
    };

    const loading = variantLoading || mediaLoading;
    const error = variantError || mediaError;

    return (
        <div className="admin-media-manager">
            {error && (
                <div className="admin-mm-error">
                    <div className="admin-error-message">Error: {error}</div>
                    <button
                        onClick={handleDismissError}
                        className="admin-mm-dismiss-btn"
                    >
                        Dismiss
                    </button>
                </div>
            )}

            <div className="admin-media-tabs">
                <button
                    className={`admin-media-tab ${activeTab === 'images' ? 'admin-active' : ''}`}
                    onClick={() => setActiveTab('images')}
                    disabled={uploading || loading}
                >
                    Images ({images.length || 0})
                </button>
                <button
                    className={`admin-media-tab ${activeTab === 'videos' ? 'admin-active' : ''}`}
                    onClick={() => setActiveTab('videos')}
                    disabled={uploading || loading}
                >
                    Videos ({videos.length || 0})
                </button>
            </div>

            <div className="admin-media-content">
                {activeTab === 'images' && (
                    <div className="admin-images-section">
                        <div className="admin-mm-upload-section">
                            <h4 className="admin-mm-upload-title">Upload Image</h4>
                            <label htmlFor="image-upload" className="admin-mm-upload-area">
                                {uploading && uploadType === 'image' ? (
                                    <div className="admin-mm-progress">
                                        <div className="admin-mm-progress-bar">
                                            <div
                                                className="admin-mm-progress-fill"
                                                style={{ width: `${uploadProgress}%` }}
                                            ></div>
                                        </div>
                                        <div className="admin-mm-progress-text">
                                            Uploading... {uploadProgress}%
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="admin-mm-upload-icon">📷</div>
                                        <div className="admin-mm-upload-text">
                                            Click to select or drag image here
                                        </div>
                                    </>
                                )}
                                <input
                                    type="file"
                                    id="image-upload"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    disabled={uploading || loading}
                                    className="admin-mm-upload-input"
                                />
                            </label>
                            <div className="admin-mm-upload-hint">
                                Supported formats: JPEG, PNG, GIF, WebP. Max size: 5MB
                            </div>
                        </div>

                        {loading && activeTab === 'images' ? (
                            <div className="admin-mm-loading">
                                <div className="admin-loading-spinner"></div>
                                Loading images...
                            </div>
                        ) : images.length === 0 ? (
                            <div className="admin-mm-empty">
                                <div className="admin-empty-icon">🖼️</div>
                                <div className="admin-empty-text">No images uploaded yet</div>
                                <div className="admin-empty-subtext">Upload your first image above</div>
                            </div>
                        ) : (
                            <div className="admin-mm-grid">
                                {images.map(image => (
                                    <div key={image.image_id} className="admin-mm-item">
                                        <div className="admin-mm-preview">
                                            <div className="admin-mm-placeholder">
                                                <div className="admin-placeholder-icon">🖼️</div>
                                                <div className="admin-placeholder-text">
                                                    {image.image_name || `Image ${image.image_id}`}
                                                </div>
                                            </div>
                                            {image.is_default && (
                                                <span className="admin-mm-default-badge">Default</span>
                                            )}
                                        </div>
                                        <div className="admin-mm-info">
                                            <span className="admin-mm-name">
                                                {image.image_name || `Image ${image.image_id}`}
                                            </span>
                                            <div className="admin-mm-meta">
                                                <span className="admin-mm-size">
                                                    {getFileSize(image.file_size)}
                                                </span>
                                                <span className="admin-mm-date">
                                                    {formatDate(image.uploaded_at || image.created_at)}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="admin-mm-actions">
                                            <button
                                                className="admin-mm-btn admin-mm-btn-default"
                                                onClick={() => handleSetDefaultImage(image.image_id)}
                                                disabled={image.is_default || uploading}
                                                title={image.is_default ? "Already default image" : "Set as default image"}
                                            >
                                                {image.is_default ? 'Default' : 'Set Default'}
                                            </button>
                                            <button
                                                className="admin-mm-btn admin-mm-btn-delete"
                                                onClick={() => handleDeleteImage(image.image_id, image.image_name)}
                                                disabled={uploading}
                                                title="Delete image"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'videos' && (
                    <div className="admin-videos-section">
                        <div className="admin-mm-upload-section">
                            <h4 className="admin-mm-upload-title">Upload Video</h4>
                            <label htmlFor="video-upload" className="admin-mm-upload-area">
                                {uploading && uploadType === 'video' ? (
                                    <div className="admin-mm-progress">
                                        <div className="admin-mm-progress-bar">
                                            <div
                                                className="admin-mm-progress-fill"
                                                style={{ width: `${uploadProgress}%` }}
                                            ></div>
                                        </div>
                                        <div className="admin-mm-progress-text">
                                            Uploading... {uploadProgress}%
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="admin-mm-upload-icon">🎥</div>
                                        <div className="admin-mm-upload-text">
                                            Click to select or drag video here
                                        </div>
                                    </>
                                )}
                                <input
                                    type="file"
                                    id="video-upload"
                                    accept="video/*"
                                    onChange={handleVideoUpload}
                                    disabled={uploading || loading}
                                    className="admin-mm-upload-input"
                                />
                            </label>
                            <div className="admin-mm-upload-hint">
                                Supported formats: MP4, AVI, MOV, WMV. Max size: 50MB
                            </div>
                        </div>

                        {loading && activeTab === 'videos' ? (
                            <div className="admin-mm-loading">
                                <div className="admin-loading-spinner"></div>
                                Loading videos...
                            </div>
                        ) : videos.length === 0 ? (
                            <div className="admin-mm-empty">
                                <div className="admin-empty-icon">🎬</div>
                                <div className="admin-empty-text">No videos uploaded yet</div>
                                <div className="admin-empty-subtext">Upload your first video above</div>
                            </div>
                        ) : (
                            <div className="admin-mm-grid">
                                {videos.map(video => (
                                    <div key={video.video_id} className="admin-mm-item">
                                        <div className="admin-mm-preview">
                                            <div className="admin-mm-placeholder">
                                                <div className="admin-placeholder-icon">🎬</div>
                                                <div className="admin-placeholder-text">
                                                    {video.video_name || `Video ${video.video_id}`}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="admin-mm-info">
                                            <span className="admin-mm-name">
                                                {video.video_name || `Video ${video.video_id}`}
                                            </span>
                                            <div className="admin-mm-meta">
                                                <span className="admin-mm-size">
                                                    {getFileSize(video.file_size)}
                                                </span>
                                                <span className="admin-mm-duration">
                                                    {video.duration || 'N/A'}s
                                                </span>
                                            </div>
                                        </div>
                                        <div className="admin-mm-actions">
                                            <button
                                                className="admin-mm-btn admin-mm-btn-delete"
                                                onClick={() => handleDeleteVideo(video.video_id, video.video_name)}
                                                disabled={uploading}
                                                title="Delete video"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MediaManager;