import React, { useState } from 'react';
import { UploadCloud } from 'lucide-react';
import { parseQRFromImage } from '../utils/imageParser';
import { generateSVG } from '../utils/qrUtils';
import './Dropzone.css';

interface DropzoneProps {
    onSuccess: (svgString: string, originalText: string) => void;
    onError: (error: string) => void;
}

export const Dropzone: React.FC<DropzoneProps> = ({ onSuccess, onError }) => {
    const [isDragActive, setIsDragActive] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(false);
    };

    const processFile = async (file: File) => {
        if (!file.type.startsWith('image/')) {
            onError('Please upload an image file (PNG, JPG, etc.)');
            return;
        }

        // Clean up previous optional preview url
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }

        const newPreviewUrl = URL.createObjectURL(file);
        setPreviewUrl(newPreviewUrl);

        setIsLoading(true);
        try {
            const qrText = await parseQRFromImage(file);
            const svg = await generateSVG(qrText);
            onSuccess(svg, qrText);
        } catch (err) {
            onError(err instanceof Error ? err.message : 'Failed to parse QR code from image');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            await processFile(file);
        }
    };

    const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            await processFile(file);
        }
    };

    return (
        <div
            className={`dropzone-container ${isDragActive ? 'drag-active' : ''}`}
            onDragEnter={handleDragEnter}
            onDragOver={(e) => e.preventDefault()}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <input
                type="file"
                id="fileInput"
                className="file-input"
                accept="image/*"
                onChange={handleFileInput}
            />
            <label htmlFor="fileInput" className="dropzone-content">
                <div className="icon-wrapper">
                    {isLoading ? (
                        <div className="loader"></div>
                    ) : previewUrl ? (
                        <img src={previewUrl} alt="Preview" className="preview-image" />
                    ) : (
                        <UploadCloud size={48} className="cloud-icon" />
                    )}
                </div>
                <div className="text-content">
                    <h3>{previewUrl ? 'Change QR Image' : 'Drag & Drop your QR Image'}</h3>
                    <p>or click to browse from your computer</p>
                </div>
                <div className="support-text">
                    Supports PNG, JPG, WebP
                </div>
            </label>
        </div>
    );
};
