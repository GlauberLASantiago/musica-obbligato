export default async function handler(req, res) {
  // Apenas permitimos pedidos POST do nosso frontend
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { messages } = req.body;
  
  // A CHAVE SECRETA: O Vercel vai ler isto das Variáveis de Ambiente
  const apiKey = process.env.OPENROUTER_API_KEY; 

  if (!apiKey) {
    console.error("ERRO: A variável OPENROUTER_API_KEY não foi configurada no Vercel.");
    return res.status(500).json({ error: 'Chave da API não configurada no servidor.' });
  }

  // Defina seus modelos aqui, em ordem de prioridade (do favorito para o último recurso)
  const modelosParaTentar = [
    "openai/gpt-oss-20b:free",
    "google/gemma-4-26b-a4b-it:free", // Alternativa 1
    "nvidia/nemotron-3-super-120b-a12b:free" // Alternativa 2
  ];

  // Loop que tenta cada modelo da lista
  for (const modeloAtual of modelosParaTentar) {
    try {
      console.log(`Tentando o modelo: ${modeloAtual}...`);
      
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "HTTP-Referer": "https://musica-obbligato.vercel.app", 
          "X-OpenRouter-Title": "Musica obbligato",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: modeloAtual, 
          messages: messages
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Sucesso! Retorna os dados para o frontend e encerra a função
        return res.status(200).json(data);
      } else {
        // A API respondeu, mas com erro (ex: modelo sobrecarregado).
        // Registra o aviso no Vercel e o loop continua para o próximo modelo.
        console.warn(`Aviso: O modelo ${modeloAtual} falhou (Status: ${response.status}). Tentando o próximo...`, data);
      }
      
    } catch (error) {
      // Ocorreu um erro de rede na requisição (timeout, DNS, etc).
      // Registra e continua para o próximo.
      console.error(`Erro de conexão ao tentar o modelo ${modeloAtual}:`, error);
    }
  }

  // Se o código chegar até aqui, significa que o loop terminou e TODOS os modelos falharam
  console.error("ERRO CRÍTICO: Todos os modelos de IA falharam.");
  return res.status(500).json({ error: "Ocorreu um erro interno: Nenhum modelo de IA está respondendo no momento." });
}
