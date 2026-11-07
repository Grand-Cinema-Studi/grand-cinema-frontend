import { Injectable } from '@angular/core';
import jsQR from 'jsqr';

/**
 * US 4.1: reads the QR code in the current image of a video, in the browser, with jsqr; null when
 * there is none. Apart from the scanner, so that its tests need neither a canvas nor jsqr.
 */
@Injectable({ providedIn: 'root' })
export class QrFrameReader {
  private readonly canvas = document.createElement('canvas');

  read(video: HTMLVideoElement): string | null {
    const width = video.videoWidth;
    const height = video.videoHeight;
    const context = this.canvas.getContext('2d', { willReadFrequently: true });
    if (!context || width === 0) {
      return null;
    }
    this.canvas.width = width;
    this.canvas.height = height;
    context.drawImage(video, 0, 0, width, height);
    const image = context.getImageData(0, 0, width, height);
    return jsQR(image.data, width, height)?.data || null;
  }
}
