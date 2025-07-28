// api/find-rss.js
const axios = require('axios');
const cheerio = require('cheerio');

module.exports = async (req, res) => {
  const { url: siteUrl } = req.query;

  if (!siteUrl) {
    return res.status(400).json({ error: 'URL do site é obrigatória.' });
  }

  try {
    const { data: html } = await axios.get(siteUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
      }
    });

    const $ = cheerio.load(html);
    const feedUrl = $('link[type="application/rss+xml"]').attr('href') || 
                    $('link[type="application/atom+xml"]').attr('href');

    if (!feedUrl) {
      return res.status(404).json({ error: 'Nenhum feed RSS ou ATOM encontrado nesta URL.' });
    }
    
    const absoluteFeedUrl = new URL(feedUrl, siteUrl).href;

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json({ feedUrl: absoluteFeedUrl });

  } catch (error) {
    console.error('Erro ao encontrar feed:', error);
    res.status(500).json({ error: 'Falha ao buscar a página do site.', details: error.message });
  }
};