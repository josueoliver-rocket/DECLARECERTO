import { createClient } from "https://esm.sh/@supabase/supabase-js@2.87.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { nome, email } = await req.json();

    const ADMIN_EMAIL = "josue.declarecerto@outlook.com";
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Use Lovable AI to send a simple notification
    // For now, log the signup and we can enhance with email later
    console.log(`[NEW SIGNUP] Nome: ${nome || "N/A"}, Email: ${email}`);

    // Store notification in a simple way - we'll use the admin panel for visibility
    // The edge function is called so we have a server-side record
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Log to console for monitoring
    console.log(`New user signup notification - should be sent to ${ADMIN_EMAIL}`);
    console.log(`User: ${nome} (${email})`);
    console.log(`Time: ${new Date().toISOString()}`);

    return new Response(
      JSON.stringify({ success: true, message: "Notification logged" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in notify-new-signup:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process notification" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
