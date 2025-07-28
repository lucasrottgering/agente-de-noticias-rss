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
  if (!Array.isArray(feedUrls)) {
    feedUrls = [feedUrls];
  }

  try {
    const feedPromises = feedUrls.map(url => parser.parseURL(url).catch(e => {
        console.warn(`Falha ao buscar feed: ${url}`, e.message);
        return null; // Retorna nulo em caso de erro para não quebrar o Promise.all
    }));
    const feeds = (await Promise.all(feedPromises)).filter(Boolean); // Filtra os nulos

    let allItems = feeds.flatMap(feed => feed.items);

    if (keyword) {
      allItems = allItems.filter(item => item.title && item.title.toLowerCase().includes(keyword.toLowerCase()));
    }
    if (year && !isNaN(parseInt(year))) {
      allItems = allItems.filter(item => item.pubDate && new Date(item.pubDate).getFullYear() === parseInt(year));
    }

    // Ordenação mais segura, que não quebra com datas inválidas.
    allItems.sort((a, b) => {
        try {
            const dateA = a.pubDate ? new Date(a.pubDate) : 0;
            const dateB = b.pubDate ? new Date(b.pubDate) : 0;
            if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) return 0;
            return dateB - dateA;
        } catch (e) {
            return 0;
        }
    });
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json(allItems.slice(0, 50));

  } catch (error) {
    console.error('Erro ao buscar ou filtrar feeds:', error);
    res.status(500).json({ error: 'Falha ao processar os feeds RSS.', details: error.message });
  }
};
