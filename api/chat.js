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

  try {
    // Comunicação segura com a OpenRouter (a chave não é enviada para o navegador)
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": "https://musica-obbligato.vercel.app", 
        "X-OpenRouter-Title": "Musica obbligato",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-20b:free", 
        messages: messages
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Erro da OpenRouter:", data);
      return res.status(response.status).json(data);
    }

    res.status(200).json(data);
    
  } catch (error) {
    console.error("Erro no backend:", error);
    res.status(500).json({ error: "Ocorreu um erro interno ao comunicar com a IA." });
  }
}
