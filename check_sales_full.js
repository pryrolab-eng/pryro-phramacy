const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres.rqhxfzscbrsndvjobbme:k9ZGdt.Km59bYi%24@aws-0-eu-west-1.pooler.supabase.com:5432/postgres?sslmode=require&schema=public"
    }
  }
});

async function main() {
  try {
    const result = await prisma.$queryRaw`SELECT column_name FROM information_schema.columns WHERE table_name = 'sales' AND table_schema = 'public';`;
    console.log('Columns in sales table:', result.map(r => r.column_name).sort().join(', '));
    
    // Check expected columns from schema
    const expected = ['id', 'pharmacy_id', 'cashier_id', 'customer_id', 'customer_name', 'customer_phone', 'patient_name', 'insurance_provider_id', 'subtotal', 'insurance_amount', 'customer_amount', 'total_amount', 'payment_method', 'status', 'rra_invoice_number', 'receipt_number', 'notes', 'created_at', 'updated_at', 'branch_id', 'shift_id'];
    const actual = result.map(r => r.column_name);
    const missing = expected.filter(c => !actual.includes(c));
    const extra = actual.filter(c => !expected.includes(c));
    
    console.log('Missing columns:', missing);
    console.log('Extra columns:', extra);
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();