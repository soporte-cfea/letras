import { createClient } from "@supabase/supabase-js";
const supabaseUrl = "https://llpzuvuyhibuodetdqjx.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxscHp1dnV5aGlidW9kZXRkcWp4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTUxMTIxOSwiZXhwIjoyMDY1MDg3MjE5fQ.GFfi9sJN837a0ZdiMoRuWmqs-rRg56-nuy4S3D0Nf00";
const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
