// netlify/functions/saveMenu.js
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

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  try {
    const payload = JSON.parse(event.body);
    const { plats, menuJour } = payload;
    const restaurantId = (payload.restaurantId || payload.restaurant_id || event.headers["x-restaurant-id"] || "rest-1").trim();

    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return {
        statusCode: 200,
        headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" },
        body: JSON.stringify({ warning: "Supabase credentials missing" })
      };
    }

    const authHeader = event.headers["authorization"] || `Bearer ${supabaseKey}`;

    const record = {
      id: `settings-${restaurantId}`,
      restaurant_id: restaurantId,
      plats: plats,
      menu_jour: menuJour,
      updated_at: new Date().toISOString()
    };

    const response = await fetch(`${supabaseUrl}/rest/v1/yikeli_settings`, {
      method: "POST",
      headers: {
        "apikey": supabaseKey,
        "Authorization": authHeader,
        "x-restaurant-id": restaurantId,
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates"
      },
      body: JSON.stringify(record)
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn("Table yikeli_settings may not exist yet:", errText);
      return {
        statusCode: 200,
        headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" },
        body: JSON.stringify({ warning: "Could not write to yikeli_settings table. Make sure to create it with columns: id (text PK), plats (json), menu_jour (json)." })
      };
    }

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" },
      body: JSON.stringify({ status: "success" })
    };
  } catch (error) {
    console.error("Error in saveMenu:", error);
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: error.message })
    };
  }
}
