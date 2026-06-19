// netlify/functions/saveOrder.js
export async function handler(event, context) {
  const data = JSON.parse(event.body);

  // Ici tu envoies la commande vers ta base (ex: Supabase, MongoDB Atlas, etc.)
  // Exemple fictif :
  // await db.collection("orders").insertOne(data);

  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Commande enregistrée avec succès !" }),
  };
}
