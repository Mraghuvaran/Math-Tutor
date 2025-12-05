import React, { useEffect, useRef, useState, useCallback } from 'react';
import { RefreshCw, AlertCircle, Camera } from 'lucide-react';

interface CameraViewProps {
  onCapture: (imageData: string) => void;
  isProcessing: boolean;
}

export const CameraView: React.FC<CameraViewProps> = ({ onCapture, isProcessing }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Use a ref for the stream to manage cleanup without triggering re-renders
  const streamRef = useRef<MediaStream | null>(null);
  
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    setIsInitializing(true);
    setError(null);
    stopCamera();

    // 1. Security Check: Camera API requires HTTPS or localhost
    const isSecure = window.isSecureContext;
    if (!isSecure) {
        setError("Camera access requires a secure HTTPS connection.");
        setIsInitializing(false);
        return;
    }

    // 2. Browser Support Check
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError("Your browser does not support camera access.");
        setIsInitializing(false);
        return;
    }

    // Helper to attempt getting a stream with specific constraints
    const getStream = async (constraints: MediaStreamConstraints): Promise<MediaStream | null> => {
        try {
            return await navigator.mediaDevices.getUserMedia(constraints);
        } catch (err) {
            console.warn("Camera constraint failed:", constraints, err);
            return null;
        }
    };

    try {
        let stream: MediaStream | null = null;

        // Attempt 1: High Quality Back Camera
        // Best for reading text/math
        stream = await getStream({
            video: {
                facingMode: 'environment',
                width: { ideal: 1920 },
                height: { ideal: 1080 }
            },
            audio: false
        });

        // Attempt 2: Standard Back Camera (Relaxed resolution)
        if (!stream) {
            stream = await getStream({
                video: { facingMode: 'environment' },
                audio: false
            });
        }

        // Attempt 3: Any Camera (Front/Webcam fallback)
        if (!stream) {
            stream = await getStream({
                video: true,
                audio: false
            });
        }

        if (stream) {
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                // Explicitly wait for video to be ready and play
                videoRef.current.onloadedmetadata = async () => {
                    try {
                        await videoRef.current?.play();
                    } catch (e) {
                        console.error("Playback failed:", e);
                    }
                };
            }
            setHasPermission(true);
        } else {
            throw new Error("No camera device found or permission denied.");
        }

    } catch (err: any) {
        console.error("Final camera error:", err);
        setHasPermission(false);
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            setError("Camera permission denied. Please allow access in your browser settings.");
        } else if (err.name === 'NotFoundError') {
            setError("No camera device found.");
        } else {
            setError("Unable to access camera. Please try again.");
        }
    } finally {
        setIsInitializing(false);
    }
  }, [stopCamera]);

  useEffect(() => {
    startCamera();
    // Cleanup on unmount
    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  const handleCapture = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || isProcessing) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (context && video.videoWidth > 0 && video.videoHeight > 0) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const imageData = canvas.toDataURL('image/jpeg', 0.85);
      onCapture(imageData);
    }
  }, [onCapture, isProcessing]);

  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden">
      {/* Video Feed */}
      <video
        ref={videoRef}
        playsInline
        autoPlay
        muted
        className={`w-full h-full object-cover transition-opacity duration-500 ${hasPermission ? 'opacity-100' : 'opacity-0'}`}
      />

      {/* Error / Loading State Overlay */}
      {(!hasPermission || error) && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10 px-6 text-center">
           {isInitializing ? (
             <div className="flex flex-col items-center gap-4 text-gray-400">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                <p>Starting camera...</p>
             </div>
           ) : (
             <div className="flex flex-col items-center gap-4 max-w-sm">
                <AlertCircle className="w-16 h-16 text-red-500 mb-2" />
                <h3 className="text-xl font-bold text-white">Camera Issue</h3>
                <p className="text-gray-400">{error || "Could not access camera."}</p>
                <button 
                  onClick={startCamera}
                  className="mt-4 px-6 py-3 bg-indigo-600 rounded-full text-white font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2"
                >
                  <RefreshCw size={18} />
                  Retry Camera
                </button>
             </div>
           )}
        </div>
      )}

      {/* Hidden Canvas for Capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Capture Overlay / Guide */}
      {hasPermission && (
         <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center animate-in fade-in duration-700">
            {/* Viewfinder frame */}
            <div className="w-64 h-64 md:w-96 md:h-96 border-2 border-white/30 rounded-3xl relative">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white -mt-1 -ml-1 rounded-tl-xl shadow-sm"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white -mt-1 -mr-1 rounded-tr-xl shadow-sm"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white -mb-1 -ml-1 rounded-bl-xl shadow-sm"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white -mb-1 -mr-1 rounded-br-xl shadow-sm"></div>
            </div>
            <p className="mt-6 text-white/90 bg-black/50 px-4 py-2 rounded-full text-sm backdrop-blur-md border border-white/10 font-medium">
                Align math problem here
            </p>
         </div>
      )}

      {/* Capture Trigger Button */}
      {hasPermission && (
        <div className="absolute bottom-24 md:bottom-12 w-full flex justify-center pointer-events-auto z-20">
          <button
            onClick={handleCapture}
            disabled={isProcessing}
            className={`
              relative w-20 h-20 rounded-full border-4 border-white flex items-center justify-center
              transition-all duration-300 shadow-xl
              ${isProcessing ? 'opacity-50 cursor-not-allowed scale-90' : 'hover:scale-110 active:scale-95 bg-white/10 backdrop-blur-sm'}
            `}
            aria-label="Capture Image"
          >
            <div className={`w-16 h-16 rounded-full bg-white shadow-inner transition-all duration-500 ${isProcessing ? 'animate-pulse bg-indigo-400 scale-75' : ''}`}></div>
            {!isProcessing && (
                <div className="absolute inset-[-8px] rounded-full border border-white/30 animate-pulse-ring"></div>
            )}
          </button>
        </div>
      )}
    </div>
  );
};