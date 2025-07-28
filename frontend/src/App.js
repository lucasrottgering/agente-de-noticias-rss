// frontend/src/App.js
import React, { useState, useEffect } from 'react';
import { Rss, Newspaper, LoaderCircle, AlertTriangle, Plus, Trash2, Search, Sparkles } from 'lucide-react';

function App() {
  const [feeds, setFeeds] = useState(() => JSON.parse(localStorage.getItem('rssFeeds')) || []);
  const [urlInput, setUrlInput] = useState('');
  const [news, setNews] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ keyword: '', year: '' });

  useEffect(() => {
    localStorage.setItem('rssFeeds', JSON.stringify(feeds));
  }, [feeds]);

  const discoverFeed = async () => {
      if (!urlInput) {
          setError('Insira a URL de um site para descobrir o feed.');
          return;
      }
      setIsDiscovering(true);
      setError(null);
      try {
          const backendUrl = `/api/find-rss?url=${encodeURIComponent(urlInput)}`;
          const response = await fetch(backendUrl);
          const data = await response.json();
          if (!response.ok) throw new Error(data.error || 'Erro desconhecido');
          setUrlInput(data.feedUrl); // Preenche o campo com a URL encontrada
      } catch (err) {
          setError(err.message);
      } finally {
          setIsDiscovering(false);
      }
  };

  const addFeed = (e) => {
    e.preventDefault();
    if (urlInput && !feeds.includes(urlInput)) {
      setFeeds([...feeds, urlInput]);
      setUrlInput('');
    }
  };

  const removeFeed = (urlToRemove) => {
    setFeeds(feeds.filter(feed => feed !== urlToRemove));
  };

  const fetchAndFilterNews = async () => {
    if (feeds.length === 0) {
      setError('Adicione pelo menos uma URL de feed RSS para buscar.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setNews([]);

    const params = new URLSearchParams();
    feeds.forEach(feed => params.append('feed', feed));
    if (filters.keyword) params.append('keyword', filters.keyword);
    if (filters.year) params.append('year', filters.year);

    const backendUrl = `/api/fetch-and-filter?${params.toString()}`;

    try {
      const response = await fetch(backendUrl);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao buscar notícias.');
      }
      const items = await response.json();
      
      const formattedNews = items.map(item => ({
        title: item.title,
        summary: item.contentSnippet || item.content?.replace(/<[^>]*>?/gm, '') || 'Resumo não disponível.',
        link: item.link,
        source: new URL(item.link).hostname.replace('www.', ''),
        tags: Array.isArray(item.categories) ? item.categories : []
      }));

      setNews(formattedNews);
      if(formattedNews.length === 0) {
        setError("Nenhuma notícia encontrada com os filtros aplicados.")
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen font-sans text-gray-800">
      <div className="container mx-auto p-4 md:p-8">
        <Header />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6">
          <aside className="lg:col-span-4 xl:col-span-3">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 sticky top-8">
              <h2 className="text-xl font-bold mb-4">Gerenciar Feeds</h2>
              <div className="mb-4">
                  <label className="text-sm font-medium text-gray-600">URL do Site ou Feed</label>
                  <div className="flex gap-2 mt-1">
                    <input type="url" value={urlInput} onChange={(e) => setUrlInput(e.target.value)} placeholder="URL do site ou feed" className="w-full border-gray-300 rounded-lg px-3 py-2 text-sm" />
                    <button onClick={discoverFeed} disabled={isDiscovering} className="bg-purple-600 text-white p-2 rounded-lg hover:bg-purple-700 disabled:bg-purple-300">
                        {isDiscovering ? <LoaderCircle size={20} className="animate-spin"/> : <Sparkles size={20}/>}
                    </button>
                  </div>
              </div>
              <form onSubmit={addFeed} className="flex gap-2 mb-4">
                <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 flex items-center justify-center"><Plus size={20} className="mr-2"/> Adicionar Feed à Lista</button>
              </form>
              <div className="space-y-2 max-h-48 overflow-y-auto mb-6 border-t pt-4">
                {feeds.map(feed => (
                  <div key={feed} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                    <span className="text-xs truncate text-gray-600" title={feed}>{feed}</span>
                    <button onClick={() => removeFeed(feed)} className="text-red-500 hover:text-red-700"><Trash2 size={16}/></button>
                  </div>
                ))}
              </div>
              <h2 className="text-xl font-bold mb-4">Filtros</h2>
              <div className="space-y-4">
                <input type="text" value={filters.keyword} onChange={e => setFilters({...filters, keyword: e.target.value})} placeholder="Palavra-chave no título" className="w-full border-gray-300 rounded-lg px-3 py-2 text-sm" />
                <input type="number" value={filters.year} onChange={e => setFilters({...filters, year: e.target.value})} placeholder="Ano de publicação (ex: 2025)" className="w-full border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <button onClick={fetchAndFilterNews} disabled={isLoading} className="w-full mt-6 bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 flex items-center justify-center disabled:bg-green-300">
                {isLoading ? <LoaderCircle className="animate-spin"/> : <><Search className="mr-2"/> Buscar e Filtrar</>}
              </button>
            </div>
          </aside>
          <main className="lg:col-span-8 xl:col-span-9">
            <NewsFeed news={news} isLoading={isLoading} error={error} />
          </main>
        </div>
      </div>
    </div>
  );
}

const Header = () => (
  <header className="text-center mb-10">
    <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Agente Agregador de Notícias</h1>
    <p className="text-md text-gray-600 mt-2">Suas fontes de notícias, filtradas e organizadas</p>
  </header>
);
const NewsFeed = ({ news, isLoading, error }) => {
  if (isLoading) return <div className="flex flex-col items-center justify-center text-center py-16"><LoaderCircle className="w-12 h-12 text-blue-600 animate-spin" /><p className="mt-4 text-lg text-gray-600">Buscando e filtrando notícias...</p></div>;
  if (error) return <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center"><AlertTriangle className="w-12 h-12 text-red-500 mx-auto" /><h3 className="mt-4 text-xl font-bold text-red-700">Ocorreu um Erro</h3><p className="mt-2 text-red-600 max-w-md mx-auto">{error}</p></div>;
  if (news.length === 0) return <div className="flex flex-col items-center justify-center text-center py-16"><Newspaper className="w-12 h-12 text-gray-400" /><h3 className="mt-4 text-xl font-bold text-gray-700">Nenhuma notícia para exibir</h3><p className="mt-2 text-gray-500 max-w-md">Adicione feeds e aplique filtros para começar.</p></div>;
  return <div className="space-y-6">{news.map((item, index) => <NewsItem key={`${item.link}-${index}`} item={item} />)}</div>;
};
const NewsItem = ({ item }) => (
  <article className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md hover:border-blue-300 transition-all duration-300">
    <h3 className="text-lg font-bold text-gray-900 leading-tight"><a href={item.link} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors">{item.title}</a></h3>
    <p className="mt-3 text-gray-600 text-sm leading-relaxed">{item.summary}</p>
    <div className="mt-4 flex flex-wrap items-center justify-between gap-4"><div className="flex flex-wrap gap-2">{item.tags && item.tags.map((tag, i) => <span key={i} className="px-2.5 py-1 text-xs font-semibold text-blue-800 bg-blue-100 rounded-full">{tag}</span>)}</div><a href={item.link} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors">Fonte: {item.source}</a></div>
  </article>
);

export default App;


