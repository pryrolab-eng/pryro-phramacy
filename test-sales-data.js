// Test if sales data exists
fetch('http://localhost:3000/api/sales')
  .then(res => res.json())
  .then(data => {
    console.log('Sales API Response:', data)
    console.log('Number of sales:', data.sales?.length || 0)
    console.log('Stats:', data.stats)
  })
  .catch(err => console.error('Error:', err))
