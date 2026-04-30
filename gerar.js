import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';

// Cria a pasta "etiquetas" se não existir
const dir = 'C:/Users/Odon Neto/Documents/Projetos/projeto_enxoval/etiquetas';
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
}

// Função para gerar 1000 QR Codes
async function gerarLote() {
    console.log("Iniciando geração...");
    
    for (let i = 1; i <= 1000; i++) {
        // Formata o número com zeros à esquerda (ex: ENX-0001)
        const idFormatado = String(i).padStart(4, '0');
        const codigo = `ENX-${idFormatado}`;
        
        const caminhoArquivo = path.join(dir, `${codigo}.png`);
        
        try {
            // Gera a imagem do QR Code com o texto
            await QRCode.toFile(caminhoArquivo, codigo, {
                width: 300,
                margin: 2,
                color: {
                    dark: '#000000',  // Cor dos quadrados
                    light: '#FFFFFF' // Cor do fundo
                }
            });
        } catch (err) {
            console.error(`Erro ao gerar ${codigo}:`, err);
        }
    }
    
    console.log("Pronto! 1000 QR Codes gerados na pasta 'etiquetas'.");
}

gerarLote();