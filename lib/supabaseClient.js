import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// This file only ever uses the public URL + publishable/anon key.
// Never import the Supabase "Secret key" here — it must not be used
// in any code that runs in the browser.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
