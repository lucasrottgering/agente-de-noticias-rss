// api/fetch-rss.js

// Importa as bibliotecas necessárias.
const Parser = require('rss-parser');

// Instancia o parser com opções customizadas.
const parser = new Parser({
  // Adiciona um cabeçalho de User-Agent para simular um navegador mais moderno.
  // Isso é crucial para evitar ser bloqueado por sites com segurança anti-robô.
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
  },
});

// Esta é a função principal que a Vercel irá executar.
module.exports = async (req, res) => {
  // Pega a URL do feed que nosso frontend enviou.
  const { url: feedUrl } = req.query;

  // Se o frontend não enviar uma URL, retorna um erro.
  if (!feedUrl) {
    return res.status(400).json({ error: 'URL do feed é obrigatória.' });
  }

  try {
    // O backend (aqui na Vercel) busca e analisa o feed RSS.
    const feed = await parser.parseURL(feedUrl);

    // Permite que qualquer domínio (incluindo nosso app frontend) acesse esta API.
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    
    // Envia os dados do feed (os artigos) de volta para o frontend.
    res.status(200).json(feed.items);

  } catch (error) {
    console.error('Erro ao buscar feed:', error);
    res.status(500).json({ error: 'Falha ao buscar ou analisar o feed RSS. Verifique se a URL está correta e é um feed RSS válido.', details: error.message });
  }
};
