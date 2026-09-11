// netlify/functions/getOrders.js
export async function handler(event, context) {
  // Handle preflight OPTIONS request for CORS
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, apikey, Authorization, x-restaurant-id",
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      },
      body: "",
    };
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    // Isolation Multi-Tenant : déterminer l'identifiant du restaurant requis
    const queryParams = event.queryStringParameters || {};
    const restaurantId = (
      queryParams.restaurantId ||
      queryParams.restaurant_id ||
      event.headers["x-restaurant-id"] ||
      ""
    ).trim();

    if (!restaurantId) {
      return {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          error: "Paramètre 'restaurantId' manquant. L'isolation multi-restaurant exige de spécifier l'établissement.",
        }),
      };
    }

    // Si Supabase n'est pas configuré, renvoyer un tableau vide sans crash
    if (!supabaseUrl || !supabaseKey) {
      return {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
        },
        body: JSON.stringify([]),
      };
    }

    const authHeader = event.headers["authorization"] || `Bearer ${supabaseKey}`;

    // Récupérer uniquement les commandes du restaurant spécifié
    const endpoint = `${supabaseUrl}/rest/v1/yikeli_orders?restaurant_id=eq.${encodeURIComponent(restaurantId)}&select=*&order=created_at.desc`;
    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        "apikey": supabaseKey,
        "Authorization": authHeader,
        "x-restaurant-id": restaurantId,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Supabase API error:", errText);
      throw new Error(`Supabase returned error code ${response.status}: ${errText}`);
    }

    const data = await response.json();

    // Normalisation des champs pour le frontend
    const formattedOrders = data.map(order => ({
      id: order.id,
      restaurantId: order.restaurant_id || restaurantId,
      clientId: order.client_id || "",
      clientName: order.client_name || "",
      clientPhone: order.client_phone || "",
      items: order.items,
      total: Number(order.total),
      type: order.type,
      status: order.status,
      createdAt: order.created_at,
      comment: order.comment || "",
      tableNumber: order.table_number || undefined,
      cancelReason: order.cancel_reason || "",
      refusalReason: order.refusal_reason || "",
      paymentMethod: order.payment_method || "",
      takenChargeAt: order.taken_charge_at || "",
      feedback: order.feedback || undefined,
      userId: order.user_id || undefined,
      payments: order.payments || undefined
    }));

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formattedOrders),
    };
  } catch (error) {
    console.error("Error in getOrders Netlify function:", error);
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: error.message }),
    };
  }
}
