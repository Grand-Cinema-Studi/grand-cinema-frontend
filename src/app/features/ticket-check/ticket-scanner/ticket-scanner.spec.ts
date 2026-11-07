import { TestBed } from '@angular/core/testing';
import { TicketScanner } from './ticket-scanner';

// The camera and the decoder are replaced: jsdom has neither a camera nor images
vi.mock('jsqr', () => ({ default: vi.fn(() => ({ data: '0123456789abcdef0123456789abcdef' })) }));

describe('US 4.1 – TicketScanner', () => {
  const stop = vi.fn();

  function camera(getUserMedia: () => Promise<unknown>) {
    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getUserMedia },
      configurable: true,
    });
  }

  beforeEach(() => {
    vi.stubGlobal('requestAnimationFrame', (next: FrameRequestCallback) =>
      setTimeout(() => next(0), 0),
    );
    vi.stubGlobal('cancelAnimationFrame', (id: number) => clearTimeout(id));
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
    Object.defineProperty(HTMLVideoElement.prototype, 'videoWidth', {
      get: () => 4,
      configurable: true,
    });
    Object.defineProperty(HTMLVideoElement.prototype, 'videoHeight', {
      get: () => 4,
      configurable: true,
    });
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      drawImage: vi.fn(),
      getImageData: () => ({ data: new Uint8ClampedArray(64), width: 4, height: 4 }),
    } as unknown as CanvasRenderingContext2D);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('when the camera cannot be used, then a message says so', async () => {
    camera(() => Promise.reject(new Error('NotAllowedError')));

    const fixture = TestBed.createComponent(TicketScanner);
    await fixture.whenStable();
    await vi.waitFor(() =>
      expect((fixture.nativeElement as HTMLElement).textContent).toContain('Caméra indisponible'),
    );
  });

  it('when the camera reads a qr code, then its text is emitted once, not at every image', async () => {
    camera(() => Promise.resolve({ getTracks: () => [{ stop }] }));
    const fixture = TestBed.createComponent(TicketScanner);
    const scanned = vi.fn();
    fixture.componentInstance.scanned.subscribe(scanned);

    await fixture.whenStable();
    await vi.waitFor(() =>
      expect(scanned).toHaveBeenCalledWith('0123456789abcdef0123456789abcdef'),
    );
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(scanned).toHaveBeenCalledTimes(1);
    fixture.destroy();
    expect(stop).toHaveBeenCalled();
  });
});
