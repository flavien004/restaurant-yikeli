// netlify/functions/getMenu.js
export async function handler(event, context) {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, apikey, Authorization",
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      },
      body: "",
    };
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return {
        statusCode: 200,
        headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" },
        body: JSON.stringify({ plats: null, menuJour: null })
      };
    }

    const queryParams = event.queryStringParameters || {};
    const restaurantId = (
      queryParams.restaurantId ||
      queryParams.restaurant_id ||
      event.headers["x-restaurant-id"] ||
      "rest-1"
    ).trim();

    const authHeader = event.headers["authorization"] || `Bearer ${supabaseKey}`;

    // Chercher d'abord la clé spécifique au restaurant `settings-${restaurantId}`, puis repli
    let response = await fetch(`${supabaseUrl}/rest/v1/yikeli_settings?id=eq.settings-${encodeURIComponent(restaurantId)}`, {
      method: "GET",
      headers: {
        "apikey": supabaseKey,
        "Authorization": authHeader,
        "x-restaurant-id": restaurantId,
        "Content-Type": "application/json",
      }
    });

    if (!response.ok || (await response.clone().json()).length === 0) {
      // Repli sur l'identifiant simple si nécessaire
      response = await fetch(`${supabaseUrl}/rest/v1/yikeli_settings?id=eq.${encodeURIComponent(restaurantId)}`, {
        method: "GET",
        headers: {
          "apikey": supabaseKey,
          "Authorization": authHeader,
          "x-restaurant-id": restaurantId,
          "Content-Type": "application/json",
        }
      });
    }

    if (!response.ok) {
      // If table doesn't exist yet, return empty gracefully to avoid crash
      return {
        statusCode: 200,
        headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" },
        body: JSON.stringify({ plats: null, menuJour: null })
      };
    }

    const data = await response.json();
    if (data && data.length > 0) {
      return {
        statusCode: 200,
        headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" },
        body: JSON.stringify({
          plats: data[0].plats,
          menuJour: data[0].menu_jour
        }),
      };
    }

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" },
      body: JSON.stringify({ plats: null, menuJour: null })
    };
  } catch (error) {
    console.error("Error in getMenu:", error);
    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" },
      body: JSON.stringify({ plats: null, menuJour: null, error: error.message })
    };
  }
}
