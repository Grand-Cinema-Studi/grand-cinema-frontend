import {
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  inject,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { QrFrameReader } from './qr-frame-reader';

/** The same QR code in front of the camera is read once, then ignored for this long. */
const SAME_CODE_PAUSE_MS = 3000;

/**
 * US 4.1: reads QR codes with the back camera of the phone. Every image is read in the browser
 * (QrFrameReader): nothing leaves the phone but the text read, sent by the page to the API.
 */
@Component({
  selector: 'app-ticket-scanner',
  templateUrl: './ticket-scanner.html',
})
export class TicketScanner {
  /** The text of each QR code read by the camera. */
  readonly scanned = output<string>();

  protected readonly cameraState = signal<'starting' | 'reading' | 'unavailable'>('starting');
  private readonly video = viewChild.required<ElementRef<HTMLVideoElement>>('video');
  private readonly reader = inject(QrFrameReader);
  private stream: MediaStream | null = null;
  private frame = 0;
  private lastCode = '';
  private lastCodeAt = 0;

  constructor() {
    afterNextRender(() => void this.start());
    inject(DestroyRef).onDestroy(() => this.stop());
  }

  private async start(): Promise<void> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });
      const video = this.video().nativeElement;
      video.srcObject = this.stream;
      await video.play();
      this.cameraState.set('reading');
      this.frame = requestAnimationFrame(() => this.read());
    } catch {
      // Refused by the inspector, no camera, or a page not served over HTTPS
      this.cameraState.set('unavailable');
    }
  }

  private read(): void {
    const text = this.reader.read(this.video().nativeElement);
    if (text) {
      this.emitOnce(text);
    }
    this.frame = requestAnimationFrame(() => this.read());
  }

  private emitOnce(text: string): void {
    const now = Date.now();
    if (text === this.lastCode && now - this.lastCodeAt < SAME_CODE_PAUSE_MS) {
      return;
    }
    this.lastCode = text;
    this.lastCodeAt = now;
    this.scanned.emit(text);
  }

  private stop(): void {
    cancelAnimationFrame(this.frame);
    this.stream?.getTracks().forEach((track) => track.stop());
  }
}
