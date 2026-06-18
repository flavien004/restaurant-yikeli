import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, RefreshCw, X, AlertCircle } from 'lucide-react';

interface QRScannerProps {
  onScanSuccess: (text: string) => boolean;
  onClose: () => void;
}

export default function QRScanner({ onScanSuccess, onClose }: QRScannerProps) {
  const [cameraFacingMode, setCameraFacingMode] = useState<'environment' | 'user'>('environment');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const qrCodeInstanceRef = useRef<Html5Qrcode | null>(null);
  const containerId = 'reader-qr-canvas';

  const stopScanner = async () => {
    if (qrCodeInstanceRef.current) {
      if (qrCodeInstanceRef.current.isScanning) {
        try {
          await qrCodeInstanceRef.current.stop();
        } catch (err) {
          console.error("Erreur lors de l'arrêt du scanner:", err);
        }
      }
    }
  };

  const startScanner = async (facingMode: 'environment' | 'user') => {
    try {
      // Always stop previous scanning before starting a new one
      await stopScanner();

      const instance = new Html5Qrcode(containerId);
      qrCodeInstanceRef.current = instance;

      const config = {
        fps: 10,
        qrbox: { width: 220, height: 220 },
        aspectRatio: 1.0
      };

      await instance.start(
        { facingMode },
        config,
        (decodedText) => {
          // Success callback of scanner returns true if valid and handled
          const isValid = onScanSuccess(decodedText);
          if (!isValid) {
            setErrorMessage("Code QR non reconnu. Placez le code QR d'une table valide (Table 1 à 20).");
          }
        },
        () => {
          // Failure callback is too noisy to log, called on every frame without a code
        }
      );
      setIsScanning(true);
      setErrorMessage(null);
    } catch (err: any) {
      console.error("Échec du démarrage du scanner:", err);
      // Give a user-friendly instruction
      setErrorMessage(
        "Impossible de démarrer la caméra. Assurez-vous d'avoir accordé l'autorisation d'accéder à la caméra dans votre navigateur ou essayez d'utiliser la caméra avant."
      );
      setIsScanning(false);
    }
  };

  useEffect(() => {
    // Auto start scanner with selected camera mode
    startScanner(cameraFacingMode);

    return () => {
      // Clean up scanner state on unmount
      stopScanner().then(() => {
        qrCodeInstanceRef.current = null;
      });
    };
  }, [cameraFacingMode]);

  const toggleCamera = () => {
    setCameraFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-5 text-white relative">
        <button
          onClick={onClose}
          type="button"
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition focus:outline-none bg-slate-800 hover:bg-slate-700 p-1.5 rounded-full cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 text-orange-400">
          <Camera className="w-5 h-5" />
          <h3 className="font-bold text-sm lg:text-base">Scanner le QR de votre Table</h3>
        </div>

        <p className="text-xs text-slate-300">
          Centrez le QR code présent sur votre table dans la zone centrale pour définir votre numéro de table.
        </p>

        {errorMessage && (
          <div className="bg-rose-950/40 border border-rose-500/30 p-3 rounded-2xl flex items-start gap-2 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span className="leading-tight">{errorMessage}</span>
          </div>
        )}

        <div className="relative aspect-square w-full max-w-[260px] mx-auto bg-black rounded-2xl overflow-hidden border border-slate-800">
          <div id={containerId} className="w-full h-full [&_video]:object-cover" />
          
          {/* Decorative alignment lines overlay */}
          {isScanning && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-[180px] h-[180px] border-2 border-dashed border-orange-500/40 rounded-xl relative">
                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-orange-500 -mt-0.5 -ml-0.5"></div>
                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-orange-500 -mt-0.5 -mr-0.5"></div>
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-orange-500 -mb-0.5 -ml-0.5"></div>
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-orange-500 -mb-0.5 -mr-0.5"></div>
                
                {/* Horizontal scanning light animation */}
                <div className="absolute left-0 right-0 h-0.5 bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,1)] animate-bounce"></div>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 justify-center pt-2">
          <button
            type="button"
            onClick={toggleCamera}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 font-extrabold text-xs px-4 py-2.5 rounded-2xl transition border border-slate-700/60 cursor-pointer active:scale-95"
          >
            <RefreshCw className="w-3.5 h-3.5 text-orange-400" />
            <span>Caméra : {cameraFacingMode === 'environment' ? 'Arrière' : 'Avant'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
