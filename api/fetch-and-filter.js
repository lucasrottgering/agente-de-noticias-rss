// api/fetch-and-filter.js
const Parser = require('rss-parser');
const parser = new Parser({
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
  },
});

module.exports = async (req, res) => {
  let { feed: feedUrls, keyword, year } = req.query;

  if (!feedUrls) {
    return res.status(400).json({ error: 'Pelo menos uma URL de feed é obrigatória.' });
  }
  // Se apenas uma URL for enviada, ela não virá como array.
  if (!Array.isArray(feedUrls)) {
    feedUrls = [feedUrls];
  }

  try {
    // Busca todos os feeds em paralelo para mais velocidade.
    const feedPromises = feedUrls.map(url => parser.parseURL(url));
    const feeds = await Promise.all(feedPromises);

    // Junta todos os artigos de todos os feeds em uma única lista.
    let allItems = feeds.flatMap(feed => feed.items);

    // Aplica os filtros, se existirem.
    if (keyword) {
      allItems = allItems.filter(item => item.title && item.title.toLowerCase().includes(keyword.toLowerCase()));
    }
    if (year && !isNaN(parseInt(year))) {
      allItems = allItems.filter(item => item.pubDate && new Date(item.pubDate).getFullYear() === parseInt(year));
    }

    // Ordena os artigos por data de publicação, do mais novo para o mais antigo.
    allItems.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json(allItems.slice(0, 50)); // Retorna no máximo 50 artigos filtrados

  } catch (error) {
    console.error('Erro ao buscar ou filtrar feeds:', error);
    res.status(500).json({ error: 'Falha ao processar os feeds RSS.', details: error.message });
  }
};
