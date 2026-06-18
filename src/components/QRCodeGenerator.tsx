import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { Copy, Download, Printer, Camera, HelpCircle, Check, Grid, RefreshCw, Layers } from 'lucide-react';
import Logo from './Logo';

export default function QRCodeGenerator() {
  const [selectedTable, setSelectedTable] = useState<number | ''>('');
  const [qrColor, setQrColor] = useState<string>('#ea580c'); // Orange-600 by default
  const [copySuccess, setCopySuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'individual' | 'batch'>('individual');
  
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const getClientUrl = (tableNum: number | '') => {
    const origin = window.location.origin;
    const path = window.location.pathname;
    let url = `${origin}${path}?view=client`;
    if (tableNum !== '') {
      url += `&table=${tableNum}`;
    }
    return url;
  };

  const activeUrl = getClientUrl(selectedTable);

  // Generate individual QR Code on single canvas
  useEffect(() => {
    if (activeTab === 'individual' && canvasRef.current) {
      QRCode.toCanvas(
        canvasRef.current,
        activeUrl,
        {
          width: 250,
          margin: 2,
          color: {
            dark: qrColor,
            light: '#ffffff',
          },
          errorCorrectionLevel: 'H',
        },
        (error) => {
          if (error) console.error("Erreur de génération QR Code :", error);
        }
      );
    }
  }, [selectedTable, qrColor, activeTab, activeUrl]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(activeUrl);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleDownloadPng = () => {
    if (!canvasRef.current) return;
    const url = canvasRef.current.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = url;
    link.download = `yikeli_qrcode_table_${selectedTable || 'general'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const triggerPrintBatch = () => {
    // We add a class to the body, run print, and then remove it to trigger print styles
    document.body.classList.add('printing-qr-batch');
    window.print();
    document.body.classList.remove('printing-qr-batch');
  };

  return (
    <div className="space-y-6" id="qr-generator-section">
      {/* Configuration Header cards */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <h3 className="font-extrabold text-lg flex items-center gap-2">
            <span className="p-1 px-2.5 bg-orange-600/20 text-orange-400 rounded-lg text-sm border border-orange-500/10">QR</span>
            Générateur de QR Codes de Tables
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Générez des QR codes exclusifs pour vos tables. Les clients les scannent avec leurs smartphones pour ouvrir le menu ou commander directement sur place.
          </p>
        </div>

        <div className="flex gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('individual')}
            className={`px-4 py-2 text-xs font-bold rounded-xl border transition cursor-pointer ${
              activeTab === 'individual'
                ? 'bg-orange-600 border-orange-600 text-white'
                : 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-300'
            }`}
          >
            Individuel / Test
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('batch')}
            className={`px-4 py-2 text-xs font-bold rounded-xl border transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'batch'
                ? 'bg-orange-600 border-orange-600 text-white'
                : 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-300'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            Planche d'Impression (Tables 1-20)
          </button>
        </div>
      </div>

      {activeTab === 'individual' ? (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 print:hidden">
          {/* Controls Box */}
          <div className="md:col-span-7 bg-white p-6 rounded-2xl border border-gray-150 shadow-sm space-y-5">
            <h4 className="font-extrabold text-slate-800 text-sm">Génération de QR Code Client</h4>
            
            <div className="space-y-3">
              <label className="text-xs font-bold text-gray-750 block">Destination du Code QR :</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedTable('')}
                  className={`px-4 py-3 rounded-xl border text-xs font-bold transition text-left cursor-pointer ${
                    selectedTable === ''
                      ? 'bg-orange-50 border-orange-500 text-orange-900 shadow-sm'
                      : 'bg-slate-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="block font-black text-[11px] mb-0.5">🌐 MENU GÉNÉRAL & LIVRAISON</span>
                  <span className="text-[10px] text-gray-500 leading-normal block">Pour emporter, livraison ou consultation à distance.</span>
                </button>

                <div className="relative">
                  <select
                    value={selectedTable}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedTable(val ? parseInt(val, 10) : '');
                    }}
                    className={`w-full h-full px-4 py-3 rounded-xl border text-xs font-bold transition text-left appearance-none cursor-pointer focus:outline-none ${
                      selectedTable !== ''
                        ? 'bg-orange-50 border-orange-500 text-orange-900 shadow-sm'
                        : 'bg-slate-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <option value="">🍽️ COMMANDER À UNE TABLE...</option>
                    {[...Array(20)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>
                        Table N° {i + 1} ({i + 1 === 1 ? 'Chef-lieu' : `Salle ${i+1}`})
                      </option>
                    ))}
                  </select>
                  <div className="absolute top-1/2 right-3 -translate-y-1/2 pointer-events-none text-gray-500 text-xs font-bold">
                    ▼
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-750 block">Couleur du Code QR :</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'Orange Yikéli', hex: '#ea580c' },
                  { label: 'Slate Sombre', hex: '#0f172a' },
                  { label: 'Vert Chlorophylle', hex: '#16a34a' },
                  { label: 'Bordeaux Chic', hex: '#9f1239' },
                  { label: 'Bleu Royal', hex: '#1d4ed8' },
                ].map((color) => (
                  <button
                    key={color.hex}
                    type="button"
                    onClick={() => setQrColor(color.hex)}
                    className={`h-8 px-3 rounded-xl border text-[10px] font-bold flex items-center gap-1.5 transition cursor-pointer ${
                      qrColor === color.hex
                        ? 'border-slate-800 bg-slate-900 text-white font-black'
                        : 'border-gray-200 bg-white hover:bg-slate-50 text-gray-600'
                    }`}
                  >
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color.hex }} />
                    <span>{color.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-gray-200 space-y-2">
              <span className="text-[10px] font-bold text-gray-650 block tracking-wider uppercase">Lien cible généré :</span>
              <p className="text-[11px] font-mono font-semibold text-slate-800 break-all select-all leading-normal">
                {activeUrl}
              </p>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-[10px] px-3 py-1.5 rounded-lg transition active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  {copySuccess ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copySuccess ? 'Copié !' : 'Copier l\'URL'}</span>
                </button>
              </div>
            </div>

            <div className="border-t border-gray-150 pt-4 flex flex-start gap-2.5">
              <div className="p-1 px-2.5 bg-emerald-50 text-emerald-800 border border-emerald-150 rounded-2xl text-[10px] font-medium flex items-start gap-1">
                <Camera className="w-3.5 h-3.5 mt-0.5 text-emerald-600" />
                <p>
                  <strong>Totalement compatible</strong> : Vos clients scannent ce QR, et l'interface Client s'ouvre, pré-sélectionnant automatiquement le numéro de table {selectedTable ? `N° ${selectedTable}` : 'Général'}.
                </p>
              </div>
            </div>
          </div>

          {/* QR Display Preview */}
          <div className="md:col-span-5 bg-white p-6 rounded-2xl border border-gray-150 shadow-sm flex flex-col items-center justify-center text-center space-y-4">
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-450 block">Aperçu du Badge QR</span>
            
            {/* Visual simulation of a table card stand */}
            <div className="border border-gray-200 bg-slate-50 rounded-2xl p-5 shadow-lg max-w-[245px] w-full flex flex-col items-center gap-3 border-b-4 border-b-gray-300">
              <div className="p-1.5 bg-white rounded-xl shadow-xs border border-gray-100 max-w-[50px]">
                <Logo size="custom" width={32} height={32} />
              </div>
              
              <div className="text-center space-y-0.5">
                <h5 className="font-extrabold text-xs text-slate-800">Restaurant Yikéli</h5>
                <p className="text-[9px] text-gray-400 font-bold tracking-tight">MENU & COORDONNÉES</p>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-gray-200/60 shadow-inner flex items-center justify-center">
                <canvas ref={canvasRef} className="max-w-full aspect-square block w-[160px]" />
              </div>

              <div className="text-center space-y-0.5">
                <span className="bg-orange-600/10 text-orange-700 text-[10px] px-3 py-1 rounded-full font-black border border-orange-500/10 uppercase tracking-wider inline-block">
                  {selectedTable ? `Table N° ${selectedTable}` : 'LIVRAISON / EN LIGNE'}
                </span>
                <p className="text-[8px] text-gray-500 font-medium">Scannez pour commander sur votre mobile</p>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleDownloadPng}
                className="bg-orange-600 hover:bg-orange-750 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-md transition active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                Télécharger l'image PNG
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Printable Layout Warning and Print Button */}
          <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
            <div className="space-y-1">
              <h4 className="font-black text-slate-800 text-sm">Génération de Planche Complète</h4>
              <p className="text-xs text-gray-500">
                Préparez et imprimez instantanément toutes les fiches de table d'un coup (tables 1 à 20). Découpez-les et collez-les sur vos tables ou vos chevalets de table !
              </p>
            </div>
            
            <button
              type="button"
              onClick={triggerPrintBatch}
              className="bg-orange-600 hover:bg-orange-750 text-white font-extrabold text-xs px-5 py-3 rounded-xl shadow-md transition active:scale-95 cursor-pointer flex items-center gap-1.5 shrink-0 uppercase tracking-wider"
            >
              <Printer className="w-4 h-4" />
              Lancer l'impression des fiches
            </button>
          </div>

          {/* Batch Grid - Beautiful visual design cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4" id="printable-batch-grid">
            {[...Array(20)].map((_, i) => {
              const tableNum = i + 1;
              const url = getClientUrl(tableNum);
              return (
                <TableQRCard key={tableNum} tableNumber={tableNum} targetUrl={url} qrColor={qrColor} />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// Separate component for standard Table QR Card rendering (lazy Canvas drawing to support multi-renders cleanly)
interface TableQRCardProps {
  key?: React.Key;
  tableNumber: number;
  targetUrl: string;
  qrColor: string;
}

function TableQRCard({ tableNumber, targetUrl, qrColor }: TableQRCardProps) {
  const cardCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (cardCanvasRef.current) {
      QRCode.toCanvas(
        cardCanvasRef.current,
        targetUrl,
        {
          width: 180,
          margin: 1.5,
          color: {
            dark: qrColor,
            light: '#ffffff',
          },
          errorCorrectionLevel: 'H',
        },
        (error) => {
          if (error) console.error(`Erreur de génération QR Code Table ${tableNumber} :`, error);
        }
      );
    }
  }, [targetUrl, qrColor, tableNumber]);

  return (
    <div className="bg-white border-2 border-slate-200/90 rounded-2xl p-4 flex flex-col items-center text-center justify-between space-y-3 shadow-sm aspect-[4/5] max-w-[210px] mx-auto print-card-break print:shadow-none print:border-slate-800 break-inside-avoid">
      <div className="flex flex-col items-center gap-1 shrink-0">
        {/* Vector SVG representation for ultra high-fidelity printing */}
        <Logo size="custom" width={30} height={30} className="scale-90" />
        <h5 className="font-extrabold text-[11px] text-slate-850 tracking-tight leading-none uppercase">YIKÉLI</h5>
        <span className="text-[8px] text-slate-500 font-bold font-mono">Restaurant de Djorogobité</span>
      </div>

      <div className="bg-white p-1.5 rounded-xl border border-gray-150 flex items-center justify-center shrink-0">
        <canvas ref={cardCanvasRef} className="w-[110px] h-[110px] block" />
      </div>

      <div className="space-y-1 shrink-0 w-full">
        <div className="bg-slate-900 text-white rounded-lg py-1 px-3 text-[10px] font-black tracking-wider uppercase inline-block w-full">
          TABLE N° {tableNumber}
        </div>
        <p className="text-[8px] text-gray-500 leading-tight font-semibold max-w-[150px] mx-auto">
          Scannez avec l'appareil photo pour commander &amp; régler votre commande sur place.
        </p>
      </div>
    </div>
  );
}
