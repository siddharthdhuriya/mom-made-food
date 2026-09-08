import { supabase } from "@/lib/supabase";

// Single-row table (mirrors the unit_pricing pattern): one editable
// prefilled WhatsApp message used when tapping a customer's phone number
// in Reports › Customers.
export const WA_MESSAGE_ID = "customer_outreach";

export const DEFAULT_WA_MESSAGE =
  "Hi\u{1F60A}\nMaking a fresh batch of banana chips this week in small batches, as always. Let me know if you'd like to order some for you.";

export async function fetchWaMessage(): Promise<string> {
  const { data, error } = await supabase
    .from("wa_message")
    .select("message")
    .eq("id", WA_MESSAGE_ID)
    .maybeSingle();
  if (error || !data || !data.message) return DEFAULT_WA_MESSAGE;
  return data.message;
}

export async function saveWaMessage(message: string): Promise<{ error: boolean }> {
  const { error } = await supabase.from("wa_message").upsert({
    id: WA_MESSAGE_ID,
    message,
    updated_at: new Date().toISOString(),
  });
  return { error: !!error };
}
