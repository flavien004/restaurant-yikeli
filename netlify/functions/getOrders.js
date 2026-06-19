// netlify/functions/getOrders.js
export async function handler(event, context) {
  // Handle preflight OPTIONS request for CORS
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

    // If Supabase is not configured, we return an empty array gracefully to avoid crashing the app
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

    // Fetch all orders from Supabase table ordered by created_at descending
    const response = await fetch(`${supabaseUrl}/rest/v1/yikeli_orders?select=*&order=created_at.desc`, {
      method: "GET",
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
      }
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Supabase API error:", errText);
      throw new Error(`Supabase returned error code ${response.status}: ${errText}`);
    }

    const data = await response.json();

    // Map columns back to fields expected by the frontend interface
    const formattedOrders = data.map(order => ({
      id: order.id,
      clientId: order.client_id || "",
      items: order.items,
      total: Number(order.total),
      type: order.type,
      status: order.status,
      createdAt: order.created_at,
      comment: order.comment || "",
      tableNumber: order.table_number || undefined
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
