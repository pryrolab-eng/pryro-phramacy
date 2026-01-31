const http = require('http');

async function testUpgrade() {
  console.log('Testing upgrade flow...\n');
  
  const data = JSON.stringify({
    plan: 'Standard',
    useKPay: true
  });

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/payments',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        console.log('Status:', res.statusCode);
        console.log('Response:', body);
        resolve();
      });
    });

    req.on('error', (e) => {
      console.error('Error:', e.message);
      reject(e);
    });
    
    req.write(data);
    req.end();
  });
}

testUpgrade();
