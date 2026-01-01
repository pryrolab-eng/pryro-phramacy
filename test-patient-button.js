// Test Quick Add Patient Button Functionality
console.log('🧪 Testing Quick Add Patient Button...\n');

// Simulate form data from UI
const formData = {
  patientName: 'UI Test Patient',
  phoneNumber: '0788777666',
  insuranceNumber: 'UI123'
};

console.log('📝 Form Data (from UI):', formData);

// Test API call
fetch('http://localhost:3000/api/pos/quick-add-patient', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(formData)
})
.then(response => response.json())
.then(result => {
  console.log('\n✅ API Response:', result);
  
  if (result.success) {
    console.log('\n🎯 Expected UI Behavior:');
    console.log('- Show success alert: "Patient added successfully"');
    console.log('- Close dialog');
    console.log('- Add to customer suggestions list');
    console.log('- Patient searchable by typing "UI Test" or "0788777666"');
  } else {
    console.log('\n❌ Error:', result.error);
  }
})
.catch(error => {
  console.log('\n❌ Network Error:', error.message);
  console.log('🎯 UI should still show success (fallback behavior)');
});