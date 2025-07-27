// api/fetch-rss.js

// Importa as bibliotecas necessárias.
// 'rss-parser' é especialista em ler feeds RSS.
const Parser = require('rss-parser');
const parser = new Parser();

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
    // Isso contorna o problema de CORS, pois é um servidor fazendo a requisição.
    const feed = await parser.parseURL(feedUrl);

    // Permite que qualquer domínio (incluindo nosso app frontend) acesse esta API.
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    
    // Envia os dados do feed (os artigos) de volta para o frontend.
    res.status(200).json(feed.items);

  } catch (error) {
    console.error('Erro ao buscar feed:', error);
    res.status(500).json({ error: 'Falha ao buscar ou analisar o feed RSS.', details: error.message });
  }
};
