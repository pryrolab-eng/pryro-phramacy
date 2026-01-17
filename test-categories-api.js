const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://seoqhxpclcueylldhiuy.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlb3FoeHBjbGN1ZXlsbGRoaXV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzNjg4NzYsImV4cCI6MjA3Mzk0NDg3Nn0.O5F356D4IK9dtLjoiGw8uUHCJmjyV85Z4NdVDC9vtuc'
)

async function test() {
  // Sign in as pharmacy3@test.com
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'pharmacy3@test.com',
    password: 'pharmacy123' // Replace with actual password
  })

  if (authError) {
    console.error('Auth error:', authError)
    return
  }

  console.log('Logged in as:', authData.user.email)
  console.log('Access token:', authData.session.access_token)

  // Test adding category
  const response = await fetch('http://localhost:3000/api/categories', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authData.session.access_token}`
    },
    body: JSON.stringify({
      name: 'Test Category',
      description: 'Test Description'
    })
  })

  const result = await response.json()
  console.log('Response:', response.status, result)
}

test()
