import { useState, useEffect } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

interface Leitura {
  id: number;
  codigo: string;
  hora: string;
}

interface CameraDevice {
  id: string;
  label: string;
}

export default function App() {
  const [leituras, setLeituras] = useState<Leitura[]>([]);
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [lenteAtiva, setLenteAtiva] = useState<string>('');
  const [sistemaIniciado, setSistemaIniciado] = useState<boolean>(false);

  const iniciarSistema = async () => {
    if (!window.isSecureContext) {
      alert(`Acesso bloqueado pela Apple.\nO Safari exige HTTPS para vídeo ao vivo.\n\nDigite manualmente na barra de endereços:\nhttps://${window.location.host}`);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      const devices = await Html5Qrcode.getCameras();
      
      if (devices && devices.length > 0) {
        setCameras(devices);
        setLenteAtiva(devices[devices.length - 1].id);
        setSistemaIniciado(true);
      } else {
        alert("Nenhuma câmera encontrada neste dispositivo.");
      }
      
      stream.getTracks().forEach(track => track.stop());
    } catch (err) {
      console.error("Erro de permissão:", err);
      alert("Você precisa permitir o acesso à câmera para continuar.");
    }
  };

  useEffect(() => {
    if (!sistemaIniciado || !lenteAtiva) return;

    let ultimoCodigo = "";
    
    const html5QrCode = new Html5Qrcode("reader", {
      formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
      verbose: false
    });

    html5QrCode.start(
      lenteAtiva, 
      {
        fps: 15,
        qrbox: { width: 250, height: 250 }
      },
      (decodedText) => {
        if (decodedText !== ultimoCodigo) {
          ultimoCodigo = decodedText;
          
          setLeituras((prev) => [
            {
              id: Date.now(),
              codigo: decodedText,
              hora: new Date().toLocaleTimeString('pt-BR'),
            },
            ...prev,
          ]);
          
          setTimeout(() => { ultimoCodigo = ""; }, 2000);
        }
      },
      // CORREÇÃO AQUI: underline adicionado para o TS ignorar a variável e passar no build da Vercel
      (_error) => { /* Ignora erros de frame contínuos */ }
    ).catch((err) => console.error("Erro ao iniciar câmera:", err));

    return () => {
      if (html5QrCode.isScanning) {
        html5QrCode.stop()
          .then(() => html5QrCode.clear())
          .catch(console.error);
      }
    };
  }, [lenteAtiva, sistemaIniciado]);

  return (
    <div className="min-h-screen bg-gray-200 p-4 flex justify-center items-start pt-10 font-sans">
      <div className="w-full max-w-md bg-white p-4 rounded-lg shadow-md">
        <h1 className="text-xl font-bold mb-4 text-center text-gray-800">Leitor de Enxoval</h1>
        
        {!sistemaIniciado ? (
          <div className="text-center py-10 bg-gray-50 rounded border border-gray-200">
            <p className="text-sm text-gray-600 mb-4">Clique no botão abaixo para liberar a câmera no Safari.</p>
            <button 
              onClick={iniciarSistema}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded shadow-md transition-colors w-full"
            >
              Liberar e Ligar Câmera
            </button>
          </div>
        ) : (
          <>
            {cameras.length > 0 && (
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Lente Selecionada:
                </label>
                <select 
                  className="w-full border-gray-300 rounded p-2 border bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  value={lenteAtiva}
                  onChange={(e) => setLenteAtiva(e.target.value)}
                >
                  {cameras.map((cam, index) => (
                    <option key={cam.id} value={cam.id}>
                      {cam.label || `Câmera ${index + 1}`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div id="reader" className="w-full bg-black rounded overflow-hidden mb-4 min-h-[300px]"></div>
          </>
        )}

        <div>
          <h2 className="font-semibold text-gray-700 border-b pb-1 mb-2 mt-4">Registros Locais:</h2>
          <ul className="space-y-2 max-h-64 overflow-y-auto">
            {leituras.map((item) => (
              <li key={item.id} className="p-2 bg-gray-50 border border-gray-200 rounded flex justify-between items-center shadow-sm border-l-4 border-l-blue-500">
                <span className="font-mono font-bold text-blue-700">{item.codigo}</span>
                <span className="text-xs text-gray-500">{item.hora}</span>
              </li>
            ))}
            {leituras.length === 0 && (
              <p className="text-sm text-gray-400 italic">Nenhuma peça lida ainda.</p>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}