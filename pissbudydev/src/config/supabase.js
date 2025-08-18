import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'

const supabaseUrl = 'https://wirbfcnprvujkjfdbeiv.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndpcmJmY25wcnZ1amtqZmRiZWl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3NzAwMTQsImV4cCI6MjA2NzM0NjAxNH0.QAAgLQst4Zl1YKK4kafWFzcsz2sp6LSMTc8mcvr7i0U'

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})