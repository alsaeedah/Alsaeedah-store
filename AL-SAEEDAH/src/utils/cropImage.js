export const getCroppedImg = (imageSrc, pixelCrop) => {
    const createImage = (url) =>
        new Promise((resolve, reject) => {
            const image = new Image();
            image.addEventListener('load', () => resolve(image));
            image.addEventListener('error', (error) => reject(error));
            image.setAttribute('crossOrigin', 'anonymous');
            image.src = url;
        });

    return new Promise(async (resolve, reject) => {
        const image = await createImage(imageSrc);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Set canvas size to the cropped area size
        canvas.width = pixelCrop.width;
        canvas.height = pixelCrop.height;

        // Draw the cropped image onto the canvas
        ctx.drawImage(
            image,
            pixelCrop.x,
            pixelCrop.y,
            pixelCrop.width,
            pixelCrop.height,
            0,
            0,
            pixelCrop.width,
            pixelCrop.height
        );

        // Resize if larger than 500x500 to save space
        const MAX_SIZE = 500;
        let finalCanvas = canvas;

        if (canvas.width > MAX_SIZE || canvas.height > MAX_SIZE) {
            const resizedCanvas = document.createElement('canvas');
            resizedCanvas.width = MAX_SIZE;
            resizedCanvas.height = MAX_SIZE;
            const picaCtx = resizedCanvas.getContext('2d');
            picaCtx.drawImage(canvas, 0, 0, MAX_SIZE, MAX_SIZE);
            finalCanvas = resizedCanvas;
        }

        // Convert to Base64 JPEG
        resolve(finalCanvas.toDataURL('image/jpeg', 0.7));
    });
};
