// Test with browser console while logged in
// Open your app, login, then run this in browser console:

fetch('/api/insurance', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Test API Insurance',
    coverage_percentage: 85,
    contact_email: 'test@example.com'
  })
})
.then(r => r.json())
.then(d => console.log('Result:', d))
.catch(e => console.error('Error:', e));
