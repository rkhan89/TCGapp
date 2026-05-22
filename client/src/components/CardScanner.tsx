import { useState, useRef, useCallback } from 'react';
import { Camera, Upload, X, AlertCircle } from 'lucide-react';
import Tesseract from 'tesseract.js';

interface Props { onDetected: (text: string) => void; onClose: () => void; }

export default function CardScanner({ onDetected, onClose }: Props) {
  const [mode, setMode] = useState<'choose' | 'camera' | 'upload'>('choose');
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  }, []);

  const startCamera = async () => {
    setMode('camera'); setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play(); }
    } catch { setError('Camera access denied. Try uploading instead.'); setMode('choose'); }
  };

  const captureFrame = () => {
    const video = videoRef.current; const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setPreview(dataUrl); stopCamera(); runOCR(dataUrl);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => { const url = ev.target?.result as string; setPreview(url); setMode('upload'); runOCR(url); };
    reader.readAsDataURL(file);
  };

  const runOCR = async (imageData: string) => {
    setScanning(true); setError(''); setProgress(0);
    try {
      const result = await Tesseract.recognize(imageData, 'eng', {
        logger: m => { if (m.status === 'recognizing text') setProgress(Math.round((m.progress || 0) * 100)); },
      });
      const lines = result.data.text.split('\n')
        .map(l => l.trim()).filter(l => l.length > 2 && l.length < 60)
        .filter(l => /^[a-zA-Z0-9 '\-\.éàü]+$/.test(l));
      if (!lines.length) { setError('Could not read card text. Try a clearer photo.'); setScanning(false); return; }
      onDetected(lines[0]);
    } catch { setError('OCR failed. Try a clearer image.'); }
    finally { setScanning(false); }
  };

  const handleClose = () => { stopCamera(); onClose(); };
  const handleRetry = () => { setPreview(null); setError(''); setScanning(false); setProgress(0); setMode('choose'); };

  return (
    <div className="animate-fade-in" style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      backdropFilter: 'blur(8px)', zIndex: 50,
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      padding: '0 0 0 0',
    }}>
      <div className="animate-fade-up" style={{
        background: 'var(--surface)', borderRadius: '24px 24px 0 0',
        width: '100%', maxWidth: 520, overflow: 'hidden',
        border: '1px solid var(--border)', borderBottom: 'none',
      }}>
        {/* Handle */}
        <div style={{ width: 36, height: 4, background: 'var(--border)', borderRadius: 2, margin: '12px auto 0' }} />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Camera size={18} color="var(--text2)" />
            <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--text)' }}>Scan Card</span>
          </div>
          <button onClick={handleClose} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text2)' }}>
            <X size={14} />
          </button>
        </div>

        <div style={{ padding: '0 20px 32px' }}>
          {mode === 'choose' && !scanning && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <p style={{ fontSize: 14, color: 'var(--text2)', margin: '0 0 6px' }}>
                Point your camera at a card or upload a photo — OCR will auto-detect the card name.
              </p>
              <button onClick={startCamera} className="pill active" style={{ padding: '14px 20px', borderRadius: 14, fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%' }}>
                <Camera size={18} /> Use Camera
              </button>
              <button onClick={() => fileInputRef.current?.click()} className="pill" style={{ padding: '14px 20px', borderRadius: 14, fontSize: 15, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%' }}>
                <Upload size={18} /> Upload Image
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
            </div>
          )}

          {mode === 'camera' && !preview && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', background: '#000', aspectRatio: '4/3' }}>
                <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover' }} playsInline muted />
                <div style={{ position: 'absolute', inset: 16, border: '2px solid rgba(255,255,255,0.4)', borderRadius: 12, pointerEvents: 'none' }} />
              </div>
              <button onClick={captureFrame} className="pill active" style={{ padding: '14px', borderRadius: 14, fontSize: 15, fontWeight: 700, width: '100%' }}>
                Capture
              </button>
            </div>
          )}

          {preview && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ borderRadius: 16, overflow: 'hidden', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', maxHeight: 240 }}>
                <img src={preview} alt="" style={{ maxHeight: 240, maxWidth: '100%', objectFit: 'contain' }} />
              </div>
              {scanning && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 13, color: 'var(--text2)' }}>Reading card text...</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{progress}%</span>
                  </div>
                  <div style={{ height: 4, background: 'var(--border)', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: 'var(--text)', borderRadius: 999, width: `${progress}%`, transition: 'width 0.3s ease' }} />
                  </div>
                </div>
              )}
              {!scanning && !error && <p style={{ textAlign: 'center', color: '#22c55e', fontSize: 14, fontWeight: 600 }}>Card detected! Searching...</p>}
            </div>
          )}

          {error && (
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: 12 }}>
                <AlertCircle size={16} color="#ef4444" style={{ flexShrink: 0, marginTop: 1 }} />
                <span style={{ fontSize: 13, color: '#dc2626' }}>{error}</span>
              </div>
              <button onClick={handleRetry} className="pill" style={{ padding: '12px', borderRadius: 14, fontSize: 14, fontWeight: 600, width: '100%', textAlign: 'center' }}>
                Try again
              </button>
            </div>
          )}
        </div>
      </div>
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
}
