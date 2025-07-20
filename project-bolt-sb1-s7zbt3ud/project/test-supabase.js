// Simple test to check if Supabase environment variables are set correctly
console.log('Environment variables check:')
console.log('VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL || 'NOT SET')
console.log('VITE_SUPABASE_ANON_KEY:', process.env.VITE_SUPABASE_ANON_KEY || 'NOT SET')

if (!process.env.VITE_SUPABASE_URL || !process.env.VITE_SUPABASE_ANON_KEY) {
  console.error('\n❌ Supabase environment variables are not set!')
  console.log('\nPlease add your Supabase credentials to .env file:')
  console.log('VITE_SUPABASE_URL=https://your-project-id.supabase.co')
  console.log('VITE_SUPABASE_ANON_KEY=your_public_anon_key_here')
  console.log('\nYou can find these values in your Supabase project settings.')
  process.exit(1)
} else {
  console.log('\n✅ Environment variables are set!')
}