import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, RefreshCw, X, AlertCircle, Hash, Image as ImageIcon } from 'lucide-react';

interface QRScannerProps {
  onScanSuccess: (text: string) => boolean;
  onClose: () => void;
}

export default function QRScanner({ onScanSuccess, onClose }: QRScannerProps) {
  const [cameraFacingMode, setCameraFacingMode] = useState<'environment' | 'user'>('environment');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [manualTableNumber, setManualTableNumber] = useState<number | ''>('');
  const [hasPermissionError, setHasPermissionError] = useState(false);
  const qrCodeInstanceRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isStoppingRef = useRef(false);
  const containerId = 'reader-qr-canvas';

  const stopScanner = async () => {
    if (isStoppingRef.current) return;
    isStoppingRef.current = true;
    try {
      if (qrCodeInstanceRef.current && qrCodeInstanceRef.current.isScanning) {
        await qrCodeInstanceRef.current.stop();
      }
    } catch (err) {
      // Quiet fail during cleanup
      console.warn("Arrêt du scanner vidéo:", err);
    } finally {
      isStoppingRef.current = false;
    }
  };

  const startScanner = async (facingMode: 'environment' | 'user') => {
    try {
      await stopScanner();

      // Check if container element is mounted
      const element = document.getElementById(containerId);
      if (!element) return;

      if (!qrCodeInstanceRef.current) {
        qrCodeInstanceRef.current = new Html5Qrcode(containerId);
      }

      const instance = qrCodeInstanceRef.current;

      const config = {
        fps: 10,
        qrbox: { width: 220, height: 220 },
        aspectRatio: 1.0,
      };

      await instance.start(
        { facingMode },
        config,
        (decodedText) => {
          const isValid = onScanSuccess(decodedText);
          if (!isValid) {
            setErrorMessage("Code QR non reconnu. Placez le QR code d'une table valide (Table 1 à 20).");
          }
        },
        () => {
          // Frame callback without match - ignore quietly
        }
      );
      setIsScanning(true);
      setHasPermissionError(false);
      setErrorMessage(null);
    } catch (err: any) {
      // Graceful warning instead of console.error to avoid unhandled exception triggers
      console.warn("Accès caméra non disponible ou refusé:", err?.name || err?.message || err);
      setIsScanning(false);

      const errName = err?.name || '';
      const errMsg = String(err?.message || err || '');
      const isNotAllowed =
        errName === 'NotAllowedError' ||
        errName === 'PermissionDeniedError' ||
        errMsg.toLowerCase().includes('permission denied') ||
        errMsg.toLowerCase().includes('notallowederror');

      if (isNotAllowed) {
        setHasPermissionError(true);
        setErrorMessage(
          "L'accès à la caméra a été refusé par le navigateur. Vous pouvez sélectionner directement votre table ci-dessous ou autoriser la caméra dans les réglages de votre navigateur."
        );
      } else {
        setErrorMessage(
          "Caméra indisponible sur ce périphérique ou dans cet environnement. Veuillez sélectionner votre table manuellement ci-dessous."
        );
      }
    }
  };

  useEffect(() => {
    let active = true;

    // Start scanner only if active
    if (active) {
      startScanner(cameraFacingMode);
    }

    return () => {
      active = false;
      stopScanner().then(() => {
        qrCodeInstanceRef.current = null;
      });
    };
  }, [cameraFacingMode]);

  const toggleCamera = () => {
    setCameraFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  const handleManualSelect = (num: number) => {
    const success = onScanSuccess(`Table ${num}`);
    if (success) {
      onClose();
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof manualTableNumber === 'number' && manualTableNumber >= 1 && manualTableNumber <= 20) {
      handleManualSelect(manualTableNumber);
    } else {
      setErrorMessage("Veuillez saisir un numéro de table valide entre 1 et 20.");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      if (!qrCodeInstanceRef.current) {
        qrCodeInstanceRef.current = new Html5Qrcode(containerId);
      }
      const decoded = await qrCodeInstanceRef.current.scanFile(file, true);
      const ok = onScanSuccess(decoded);
      if (!ok) {
        setErrorMessage("Le QR code présent sur l'image n'est pas associé à une table valide.");
      }
    } catch (scanErr) {
      console.warn("Scan image QR impossible:", scanErr);
      setErrorMessage("Aucun QR code lisible n'a été détecté dans cette image.");
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl space-y-4 text-white relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          type="button"
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition focus:outline-none bg-slate-800 hover:bg-slate-700 p-1.5 rounded-full cursor-pointer"
          title="Fermer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 text-orange-400">
          <Camera className="w-5 h-5 shrink-0" />
          <h3 className="font-bold text-sm lg:text-base">Scanner le QR de votre Table</h3>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Centrez le QR code présent sur votre table pour définir automatiquement votre numéro de table.
        </p>

        {errorMessage && (
          <div className="bg-rose-950/40 border border-rose-500/30 p-3 rounded-2xl flex items-start gap-2 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span className="leading-tight">{errorMessage}</span>
          </div>
        )}

        {/* Video stream container */}
        <div className="relative aspect-square w-full max-w-[240px] mx-auto bg-black rounded-2xl overflow-hidden border border-slate-800 shadow-inner">
          <div id={containerId} className="w-full h-full [&_video]:object-cover" />
          
          {/* Decorative alignment lines overlay */}
          {isScanning && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-[170px] h-[170px] border-2 border-dashed border-orange-500/40 rounded-xl relative">
                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-orange-500 -mt-0.5 -ml-0.5"></div>
                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-orange-500 -mt-0.5 -mr-0.5"></div>
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-orange-500 -mb-0.5 -ml-0.5"></div>
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-orange-500 -mb-0.5 -mr-0.5"></div>
                
                {/* Horizontal scanning light animation */}
                <div className="absolute left-0 right-0 h-0.5 bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,1)] animate-bounce"></div>
              </div>
            </div>
          )}

          {!isScanning && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-slate-950/80">
              <Camera className="w-8 h-8 text-slate-600 mb-2" />
              <span className="text-[11px] text-slate-400 font-medium">
                {hasPermissionError ? 'Caméra bloquée' : 'Caméra inactive'}
              </span>
              <button
                type="button"
                onClick={() => startScanner(cameraFacingMode)}
                className="mt-2 text-xs font-bold text-orange-400 hover:text-orange-300 underline cursor-pointer"
              >
                Réessayer la caméra
              </button>
            </div>
          )}
        </div>

        {/* Controls: Camera flip & Image upload */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          <button
            type="button"
            onClick={toggleCamera}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs px-3 py-2 rounded-xl transition border border-slate-700 cursor-pointer active:scale-95"
          >
            <RefreshCw className="w-3.5 h-3.5 text-orange-400" />
            <span>Caméra : {cameraFacingMode === 'environment' ? 'Arrière' : 'Avant'}</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs px-3 py-2 rounded-xl transition border border-slate-700 cursor-pointer active:scale-95"
          >
            <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
            <span>Depuis photo</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>

        {/* Manual Table Selection Alternative (Always available for accessibility & iframe safety) */}
        <div className="pt-2 border-t border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-300 flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-orange-400" />
              Ou choisissez votre table directement :
            </span>
          </div>

          {/* Quick Table Grid (1 to 20) */}
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
            {Array.from({ length: 20 }, (_, i) => i + 1).map((num, idx) => (
              <button
                key={`manual-table-${num}-${idx}`}
                type="button"
                onClick={() => handleManualSelect(num)}
                className="py-1.5 rounded-lg text-xs font-bold font-mono bg-slate-800/90 hover:bg-orange-600 hover:text-white text-slate-300 border border-slate-700/80 transition active:scale-95 cursor-pointer text-center"
              >
                {num}
              </button>
            ))}
          </div>

          {/* Saisie manuelle par formulaire */}
          <form onSubmit={handleManualSubmit} className="flex gap-2 pt-1">
            <input
              type="number"
              min={1}
              max={20}
              placeholder="Numéro (1-20)"
              value={manualTableNumber}
              onChange={(e) => setManualTableNumber(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
              className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 font-mono"
            />
            <button
              type="submit"
              className="bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs px-4 py-1.5 rounded-xl transition cursor-pointer active:scale-95"
            >
              Valider la table
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
