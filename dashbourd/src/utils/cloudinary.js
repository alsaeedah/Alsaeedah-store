const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'yair4zft';
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'ml_default';
const API_KEY = import.meta.env.VITE_CLOUDINARY_API_KEY;
const API_SECRET = import.meta.env.VITE_CLOUDINARY_API_SECRET;

import CryptoJS from 'crypto-js';

const base64ToBlob = (base64, mime) => {
    const byteString = atob(base64.split(',')[1]);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mime });
};

export const uploadToCloudinary = (file, resourceType = 'image', onProgress, onAbort) => {
    return new Promise((resolve, reject) => {
        if (!CLOUD_NAME || !UPLOAD_PRESET) {
            reject(new Error('Cloudinary configuration missing'));
            return;
        }

        const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`;
        const xhr = new XMLHttpRequest();
        const formData = new FormData();

        // If file is a base64 string, convert it to a Blob for better platform compatibility
        let uploadFile = file;
        if (typeof file === 'string' && file.startsWith('data:')) {
            const mime = file.split(';')[0].split(':')[1];
            uploadFile = base64ToBlob(file, mime);
        }

        formData.append('file', uploadFile);
        formData.append('upload_preset', UPLOAD_PRESET);

        // Organize into folders
        const folder = resourceType === 'video' ? 'videos' : 'images';
        formData.append('folder', folder);

        xhr.open('POST', url, true);

        // Expose abort function
        if (onAbort) {
            onAbort(() => {
                xhr.abort();
            });
        }

        xhr.upload.onprogress = (e) => {
            if (e.lengthComputable && onProgress) {
                const percentComplete = Math.round((e.loaded / e.total) * 100);
                onProgress(percentComplete);
            }
        };

        xhr.onload = () => {
            if (xhr.status === 200) {
                const data = JSON.parse(xhr.responseText);
                resolve(data.secure_url);
            } else {
                try {
                    const error = JSON.parse(xhr.responseText);
                    reject(new Error(error.error?.message || 'Upload failed'));
                } catch (e) {
                    reject(new Error('Upload failed'));
                }
            }
        };

        xhr.onabort = () => {
            reject(new Error('UserCancelled'));
        };

        xhr.onerror = () => reject(new Error('Network Error'));

        xhr.send(formData);
    });
};

export const getPublicIdFromUrl = (url) => {
    try {
        if (!url) return null;
        // Example: https://res.cloudinary.com/demo/image/upload/v1234567890/sample.jpg
        // We need 'sample' (or 'folder/sample' if in folder)

        // Remove base URL
        const splitUrl = url.split('/');
        const lastPart = splitUrl.pop();
        const publicIdWithExtension = lastPart.split('.')[0];

        // Handle folders if present (simplified for now, usually upload preset handles this)
        // A better regex might be needed for complex folder structures.
        // For standard uploads: .../upload/v12345/folder/id.jpg -> folder/id

        // Let's rely on standard split logic assuming we use standard structure
        // Find indices of 'upload' and version 'v...'
        const uploadIndex = splitUrl.indexOf('upload');
        if (uploadIndex === -1) return publicIdWithExtension;

        // Everything after 'v<numbers>' (if present) or 'upload' is part of public_id
        // Usually: .../upload/v123.../folder/image.jpg

        let pathParts = splitUrl.slice(uploadIndex + 1);
        // Remove version if it exists (starts with v and is number)
        if (pathParts.length > 0 && pathParts[0].match(/^v\d+$/)) {
            pathParts.shift();
        }

        pathParts.push(publicIdWithExtension);
        return pathParts.join('/');
    } catch (error) {
        console.error("Error parsing public ID:", error);
        return null;
    }
};

export const deleteFromCloudinary = async (url, resourceType = 'image') => {
    if (!API_KEY || !API_SECRET) {
        console.warn("Cloudinary API Key or Secret missing. Cannot delete image.");
        return false;
    }

    const publicId = getPublicIdFromUrl(url);
    if (!publicId) return false;

    const timestamp = Math.round((new Date()).getTime() / 1000);
    const signatureStr = `public_id=${publicId}&timestamp=${timestamp}${API_SECRET}`;
    const signature = CryptoJS.SHA1(signatureStr).toString();

    const formData = new FormData();
    formData.append('public_id', publicId);
    formData.append('api_key', API_KEY);
    formData.append('timestamp', timestamp);
    formData.append('signature', signature);

    try {
        const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/destroy`, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        if (data.result === 'ok') {
            return true;
        } else {
            console.error("Cloudinary delete failed:", data);
            return false;
        }
    } catch (error) {
        console.error("Cloudinary delete error:", error);
        return false;
    }
};
