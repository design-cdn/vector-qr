import jsQR from 'jsqr';

export const parseQRFromImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const reader = new FileReader();

        reader.onload = (e) => {
            img.src = e.target?.result as string;
        };

        reader.onerror = () => reject(new Error('Failed to read file'));

        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            if (!ctx) {
                return reject(new Error('Failed to create canvas context'));
            }

            // Max size to prevent massive memory usage
            const MAX_WIDTH = 800;
            const MAX_HEIGHT = 800;
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                }
            } else {
                if (height > MAX_HEIGHT) {
                    width *= MAX_HEIGHT / height;
                    height = MAX_HEIGHT;
                }
            }

            canvas.width = width;
            canvas.height = height;

            // Draw image to canvas to extract pixel data
            ctx.drawImage(img, 0, 0, width, height);

            try {
                const imageData = ctx.getImageData(0, 0, width, height);
                // jsqr signature: jsQR(data, width, height)
                const code = jsQR(imageData.data, imageData.width, imageData.height);

                if (code) {
                    resolve(code.data);
                } else {
                    reject(new Error('No QR code found in image'));
                }
            } catch {
                reject(new Error('Error processing image data'));
            }
        };

        img.onerror = () => reject(new Error('Failed to load image'));

        reader.readAsDataURL(file);
    });
};
