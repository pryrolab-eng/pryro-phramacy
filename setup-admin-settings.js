const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Read .env.local file
const envPath = path.join(__dirname, '.env.local')
const envContent = fs.readFileSync(envPath, 'utf8')
const envVars = {}
envContent.split('\n').forEach(line => {
  const [key, ...values] = line.split('=')
  if (key && values.length) {
    envVars[key.trim()] = values.join('=').trim()
  }
})

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function setupAdminSettings() {
  console.log('Setting up admin settings...\n')

  // 1. Skip schema fixes for now (needs manual SQL execution)
  console.log('Step 1: Schema fixes (run fix-admin-settings-schema.sql manually if needed)')

  // 2. Insert settings
  console.log('\nStep 2: Inserting initial settings...')
  const settings = [
    { setting_key: 'platformName', setting_value: 'Pryrox' },
    { setting_key: 'adminEmail', setting_value: 'admin@pryrox.com' },
    { setting_key: 'maxPharmacies', setting_value: 100 },
    { setting_key: 'enableRegistrations', setting_value: true },
    { setting_key: 'enableNotifications', setting_value: true },
    { setting_key: 'maintenanceMode', setting_value: false },
    { setting_key: 'backupEnabled', setting_value: true },
    { setting_key: 'autoUpdates', setting_value: true },
    { setting_key: 'maxUsersPerPharmacy', setting_value: 50 },
    { setting_key: 'apiRateLimit', setting_value: 1000 },
    { setting_key: 'enableWhiteLabel', setting_value: true },
    { setting_key: 'enableMultiBranch', setting_value: true },
    { setting_key: 'dataRetentionDays', setting_value: 2555 },
    { setting_key: 'enableAuditLogs', setting_value: true },
    { setting_key: 'ssoEnabled', setting_value: false },
    { setting_key: 'encryptionEnabled', setting_value: true }
  ]

  for (const setting of settings) {
    const { error } = await supabase
      .from('system_settings')
      .upsert({ 
        pharmacy_id: null, 
        ...setting 
      }, { 
        onConflict: 'pharmacy_id,setting_key',
        ignoreDuplicates: false 
      })
    
    if (error) {
      console.log(`✗ ${setting.setting_key}: ${error.message}`)
    } else {
      console.log(`✓ ${setting.setting_key}`)
    }
  }

  // 3. Verify
  console.log('\nStep 3: Verifying settings...')
  const { data, error } = await supabase
    .from('system_settings')
    .select('*')
    .is('pharmacy_id', null)
  
  if (error) {
    console.error('Error verifying:', error.message)
  } else {
    console.log(`✓ Found ${data.length} settings in database`)
  }

  console.log('\n✅ Setup complete! Visit http://localhost:3000/admin/settings')
}

setupAdminSettings().catch(console.error)
