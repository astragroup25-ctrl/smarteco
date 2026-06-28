export async function analyzePaymentScreenshot(
  imageBase64: string,
  mimeType: string
): Promise<{
  montant: number
  date: string
  heure: string
  expediteur: string
  destinataire: string
  statut_transaction: string
  code_transaction: string
}> {
  const response = await fetch(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        max_tokens: 500,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${imageBase64}`,
                },
              },
              {
                type: 'text',
                text: `Analyse cette capture MonCash ou NatCash.
Extrait ces informations et réponds UNIQUEMENT en JSON valide, 
sans texte avant ou après :
{
  "montant": number,
  "date": "JJ/MM/AAAA",
  "heure": "HH:MM",
  "expediteur": "numéro expéditeur",
  "destinataire": "numéro destinataire",
  "statut_transaction": "success ou failed",
  "code_transaction": "code unique de la transaction"
}`,
              },
            ],
          },
        ],
      }),
    }
  )

  const data = await response.json()
  const content = data.choices[0].message.content
  const clean = content.replace(/```json|```/g, '').trim()
  return JSON.parse(clean)
}