// netlify/functions/saveOrder.js
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

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  try {
    const order = JSON.parse(event.body);

    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.warn("Supabase credentials are not set on Netlify environment variables.");
      return {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: "Commande reçue localement au niveau de la fonction Netlify, mais SUPABASE_URL et SUPABASE_ANON_KEY ne sont pas configurés dans votre tableau de bord Netlify.",
          warning: "Veuillez configurer SUPABASE_URL et SUPABASE_ANON_KEY dans Netlify pour activer la synchronisation réelle.",
          order
        }),
      };
    }

    // Format fields to match table columns
    const record = {
      id: order.id,
      client_id: order.clientId || "",
      client_name: order.clientName || null,
      client_phone: order.clientPhone || null,
      items: order.items,
      total: Number(order.total),
      type: order.type,
      status: order.status,
      created_at: order.createdAt,
      comment: order.comment || null,
      table_number: order.tableNumber || null,
      cancel_reason: order.cancelReason || null,
      refusal_reason: order.refusalReason || null,
      payment_method: order.paymentMethod || null,
      taken_charge_at: order.takenChargeAt || null,
      feedback: order.feedback || null,
      user_id: order.userId || null,
      payments: order.payments || null
    };

    const response = await fetch(`${supabaseUrl}/rest/v1/yikeli_orders`, {
      method: "POST",
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates" // acts as an upsert!
      },
      body: JSON.stringify(record)
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Supabase API error:", errText);
      throw new Error(`Supabase returned error code ${response.status}: ${errText}`);
    }

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ 
        message: "Commande enregistrée dans Supabase avec succès !", 
        orderId: order.id 
      }),
    };
  } catch (error) {
    console.error("Error in saveOrder Netlify function:", error);
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: error.message }),
    };
  }
}
