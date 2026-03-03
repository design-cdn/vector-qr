import QRCode from 'qrcode';

export const generateSVG = async (text: string): Promise<string> => {
  try {
    const qr = QRCode.create(text, { errorCorrectionLevel: 'M' });
    const size = qr.modules.size;
    const data = qr.modules.data; // 1D array

    // Create 2D matrix
    const matrix: boolean[][] = [];
    for (let y = 0; y < size; y++) {
      const row: boolean[] = [];
      for (let x = 0; x < size; x++) {
        row.push(data[y * size + x] === 1);
      }
      matrix.push(row);
    }

    // Merging algorithm
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

    // Provide standard SVG formatting matching qrcode's default viewBox logic
    // Add a simple 1 cell margin
    const margin = 1;
    const viewBoxSize = size + 2 * margin;
    const offset = margin;

    // Group everything inside a transform to push it to the right offset
    const svgCode = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewBoxSize} ${viewBoxSize}" shape-rendering="crispEdges">
  <path d="${pathStr}" fill="#000000" transform="translate(${offset}, ${offset})" />
</svg>`;

    return svgCode;
  } catch (err) {
    console.error('Error generating SVG', err);
    throw new Error('Failed to generate SVG QR code');
  }
};
