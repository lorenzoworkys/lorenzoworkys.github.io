// L'unico file da modificare per accendere tutto. Istruzioni in LEGGIMI.md.
window.LAB_CONFIG = {
  // Contatti mostrati in fondo alla pagina (lascia "" per nasconderli)
  email: "",            // es. "lore@esempio.it"
  github: "lorenzoworkys",           // il tuo nome utente GitHub, es. "lore-lab"

  // Database (Supabase) → Project Settings → API.
  // Finché sono vuoti il sito funziona lo stesso, con le note di data/posts.json;
  // commenti e scrivania si accendono appena li compili.
  supabaseUrl: "https://lkqaxbcvsrjphzrzdrur.supabase.co",      // es. "https://abcdefghijk.supabase.co"
  supabaseAnonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxrcWF4YmN2c3JqcGh6cnpkcnVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA1MTAyMzQsImV4cCI6MjEwNjA4NjIzNH0.VHhnJct1LDNlZuNSqGrVMIhYlHfAOwMZW3BDS-FmSlk"   // la chiave "anon" (o "publishable"): è pubblica per natura, non è un segreto
};
