
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qwmvqpbnxqxaoskieyyw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3bXZxcGJueHF4YW9za2lleXl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxNzQ5NTIsImV4cCI6MjA4MDc1MDk1Mn0.XLE5Bj_Rr8e_KfoM2tdIUsRRtjEiIa9s57zaznpaG00';

export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * ==========================================
 * 🚀 GOOGLE AUTH 403 HATASI ÇÖZÜMÜ:
 * ==========================================
 * 
 * 1. GOOGLE CLOUD CONSOLE (https://console.cloud.google.com/apis/credentials):
 *    - "OAuth 2.0 Client IDs" altındaki istemcinizi düzenleyin.
 *    - "Authorized redirect URIs" kısmına ŞU URL'Yİ EKLEYİN:
 *      https://qwmvqpbnxqxaoskieyyw.supabase.co/auth/v1/callback
 *    - "Authorized JavaScript origins" kısmına uygulamanızın URL'sini ekleyin (Örn: https://...stackblitz.io)
 * 
 * 2. SUPABASE DASHBOARD (Authentication > Providers > Google):
 *    - Google Cloud'dan aldığınız "Client ID" ve "Client Secret" bilgilerini buraya kaydedin.
 * 
 * 3. SUPABASE DASHBOARD (Authentication > URL Configuration):
 *    - "Site URL" alanına uygulamanızın ana linkini girin.
 *    - "Redirect allow list" kısmına uygulamanızın linkini ekleyin.
 * 
 * 4. GOOGLE OAUTH CONSENT SCREEN:
 *    - Uygulama "Testing" modundaysa, giriş yaptığınız maili "Test Users" listesine ekleyin.
 */
