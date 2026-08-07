import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = await req.json();

    // Build a WhatsApp / SMS confirmation message
    const lines: string[] = [];
    lines.push("New Diani Companion booking request");
    lines.push("");
    if (body.companion_name) lines.push(`Companion: ${body.companion_name}`);
    if (body.client_name) lines.push(`Client: ${body.client_name}`);
    if (body.client_phone) lines.push(`Phone: ${body.client_phone}`);
    if (body.client_email) lines.push(`Email: ${body.client_email}`);
    if (body.booking_date) lines.push(`Date: ${body.booking_date}`);
    if (body.start_time) lines.push(`Time: ${body.start_time}`);
    if (body.duration_hours) lines.push(`Duration: ${body.duration_hours} hours`);
    if (body.meeting_point) lines.push(`Meeting point: ${body.meeting_point}`);
    if (body.total_price) lines.push(`Total: KES ${body.total_price}`);
    if (body.notes) lines.push(`Notes: ${body.notes}`);
    lines.push("");
    lines.push("Please confirm this booking with the client.");

    const message = lines.join("\n");

    // If a WhatsApp number is configured, generate a wa.me link
    const adminPhone = Deno.env.get("ADMIN_WHATSAPP");
    let waLink: string | null = null;
    if (adminPhone) {
      waLink = `https://wa.me/${adminPhone}?text=${encodeURIComponent(message)}`;
    }

    return new Response(
      JSON.stringify({
        success: true,
        message,
        wa_link: waLink,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Failed to build notification", detail: String(err) }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
