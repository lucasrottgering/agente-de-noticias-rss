import React, { useState } from 'react';
import { Rss, Newspaper, LoaderCircle, AlertTriangle } from 'lucide-react';

// Este é o componente principal do nosso aplicativo, agora focado em RSS.
function App() {
  // --- ESTADO DA APLICAÇÃO ---
  const [feedUrl, setFeedUrl] = useState(''); // Estado para guardar a URL do feed RSS inserida pelo usuário.
  const [news, setNews] = useState([]); // Estado para guardar as notícias recebidas do backend.
  const [isLoading, setIsLoading] = useState(false); // Estado para mostrar o ícone de carregamento.
  const [error, setError] = useState(null); // Estado para mostrar mensagens de erro.

  /**
   * Esta é a função que chama o nosso novo backend na Vercel.
   */
  const fetchNewsFromRss = async (event) => {
    // Impede que a página recarregue ao enviar o formulário.
    event.preventDefault(); 
    
    // Validação simples para garantir que uma URL foi inserida.
    if (!feedUrl) {
      setError('Por favor, insira uma URL de feed RSS.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setNews([]);

    // Este é o endereço da nossa função de backend. 
    // A Vercel entende que /api/fetch-rss deve chamar o arquivo api/fetch-rss.js
    const backendUrl = `/api/fetch-rss?url=${encodeURIComponent(feedUrl)}`;

    try {
      const response = await fetch(backendUrl);

      if (!response.ok) {
        // Se o backend retornar um erro, nós o capturamos aqui.
        const errorData = await response.json();
        throw new Error(errorData.details || 'Falha ao buscar notícias do feed.');
      }

      const items = await response.json();
      
      // Transforma os dados do RSS para o formato que nosso app já entende.
      const formattedNews = items.slice(0, 15).map(item => ({
        title: item.title,
        summary: item.contentSnippet || item.content?.replace(/<[^>]*>?/gm, '') || 'Resumo não disponível.',
        link: item.link,
        source: new URL(item.link).hostname.replace('www.', ''),
        tags: Array.isArray(item.categories) ? item.categories : []
      }));

      setNews(formattedNews);

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
        <div className="max-w-3xl mx-auto">
          {/* Formulário para inserir a URL do feed RSS */}
          <form onSubmit={fetchNewsFromRss} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <label htmlFor="feedUrl" className="block text-lg font-bold text-gray-800 mb-3">
              Insira a URL do Feed RSS
            </label>
            <div className="flex items-center gap-4">
              <div className="relative flex-grow">
                <Rss className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="url"
                  id="feedUrl"
                  name="feedUrl"
                  value={feedUrl}
                  onChange={(e) => setFeedUrl(e.target.value)}
                  placeholder="Ex: https://techcrunch.com/feed/"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 transition-all duration-200 flex items-center justify-center disabled:bg-blue-300 disabled:cursor-not-allowed"
              >
                {isLoading ? <LoaderCircle className="animate-spin h-5 w-5" /> : "Buscar Notícias"}
              </button>
            </div>
          </form>

          {/* Área de exibição das notícias */}
          <main className="mt-8">
            <NewsFeed news={news} isLoading={isLoading} error={error} />
          </main>
        </div>
      </div>
    </div>
  );
}

// Componentes auxiliares para a interface (Header, NewsFeed, NewsItem)

const Header = () => (
  <header className="text-center mb-10">
    <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Agente de Curadoria RSS</h1>
    <p className="text-md text-gray-600 mt-2">Sua central de notícias a partir de fontes diretas</p>
  </header>
);

const NewsFeed = ({ news, isLoading, error }) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-16">
        <LoaderCircle className="w-12 h-12 text-blue-600 animate-spin" />
        <p className="mt-4 text-lg text-gray-600">Buscando notícias no feed...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto" />
        <h3 className="mt-4 text-xl font-bold text-red-700">Ocorreu um Erro</h3>
        <p className="mt-2 text-red-600 max-w-md mx-auto">{error}</p>
        <p className="mt-4 text-xs text-gray-500">Verifique a URL do feed ou tente novamente.</p>
      </div>
    );
  }

  if (news.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-16">
        <Newspaper className="w-12 h-12 text-gray-400" />
        <h3 className="mt-4 text-xl font-bold text-gray-700">Nenhuma notícia para exibir</h3>
        <p className="mt-2 text-gray-500 max-w-md">Insira a URL de um feed RSS acima e clique em "Buscar Notícias" para começar.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {news.map((item, index) => <NewsItem key={`${item.link}-${index}`} item={item} />)}
    </div>
  );
};

const NewsItem = ({ item }) => (
  <article className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md hover:border-blue-300 transition-all duration-300">
    <h3 className="text-lg font-bold text-gray-900 leading-tight">
      <a href={item.link} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors">
        {item.title}
      </a>
    </h3>
    <p className="mt-3 text-gray-600 text-sm leading-relaxed">{item.summary}</p>
    <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
      <div className="flex flex-wrap gap-2">
        {item.tags && item.tags.map((tag, i) => (
          <span key={i} className="px-2.5 py-1 text-xs font-semibold text-blue-800 bg-blue-100 rounded-full">{tag}</span>
        ))}
      </div>
      <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors">
        Fonte: {item.source}
      </a>
    </div>
  </article>
);

export default App;
