import QRCode from 'qrcode';

async function testQR() {
    const text = "https://example.com";
    // The raw QR code object
    const qr = QRCode.create(text, { errorCorrectionLevel: 'M' });
    const size = qr.modules.size;
    const data = qr.modules.data; // 1D array of length size * size

    console.log(`Size: ${size}`);

    // Create 2D array
    const matrix = [];
    for (let y = 0; y < size; y++) {
        const row = [];
        for (let x = 0; x < size; x++) {
            row.push(data[y * size + x]);
        }
        matrix.push(row);
    }

    // Merge algorithm
    let pathStr = "";
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            if (matrix[y][x]) {
                // Find width
                let w = 1;
                while (x + w < size && matrix[y][x + w]) {
                    w++;
                }
                // Find height
                let h = 1;
                let canExpandHeight = true;
                while (y + h < size && canExpandHeight) {
                    for (let i = 0; i < w; i++) {
                        if (!matrix[y + h][x + i]) {
                            canExpandHeight = false;
                            break;
                        }
                    }
                    if (canExpandHeight) h++;
                }

                // Mark as visited (false)
                for (let dy = 0; dy < h; dy++) {
                    for (let dx = 0; dx < w; dx++) {
                        matrix[y + dy][x + dx] = false;
                    }
                }

                // Add rect to path
                pathStr += `M${x} ${y}h${w}v${h}h-${w}Z `;
            }
        }
    }

    console.log("Path:", pathStr.substring(0, 100) + "...");
    console.log("Path length:", pathStr.length);
}

testQR();
