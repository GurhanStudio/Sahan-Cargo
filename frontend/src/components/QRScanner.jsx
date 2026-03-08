import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

export default function QRScanner({ onScan, onError }) {
  const scannerRef = useRef(null);
  const html5QrRef = useRef(null);
  const [isScanning, setIsScanning] = useState(false);

  const startScanner = async () => {
    if (html5QrRef.current) return;
    try {
      const html5Qr = new Html5Qrcode('qr-reader');
      html5QrRef.current = html5Qr;

      await html5Qr.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          // Extract tracking number from URL or raw text
          let trackingNumber = decodedText;
          if (decodedText.includes('/receiver/confirm/')) {
            trackingNumber = decodedText.split('/receiver/confirm/').pop();
          }
          onScan(trackingNumber);
          stopScanner();
        },
        () => {} // Ignore errors during scanning
      );
      setIsScanning(true);
    } catch (err) {
      onError?.(err.message || 'Failed to start scanner');
    }
  };

  const stopScanner = async () => {
    if (html5QrRef.current) {
      try {
        await html5QrRef.current.stop();
        html5QrRef.current.clear();
      } catch (e) {}
      html5QrRef.current = null;
      setIsScanning(false);
    }
  };

  useEffect(() => {
    return () => { stopScanner(); };
  }, []);

  return (
    <div className="space-y-4">
      <div id="qr-reader" ref={scannerRef} className="rounded-2xl overflow-hidden bg-gray-800"></div>
      <div className="flex gap-3">
        {!isScanning ? (
          <button onClick={startScanner} className="btn-primary flex-1">
            📷 Start Scanner
          </button>
        ) : (
          <button onClick={stopScanner} className="btn-danger flex-1">
            ⏹ Stop Scanner
          </button>
        )}
      </div>
    </div>
  );
}
