'use client'

import { useState } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'

// Test component to verify sidebar navigation
export default function TestSidebar() {
  const [testEmail, setTestEmail] = useState('')
  const [result, setResult] = useState('')

  const testSidebarLogic = (email: string) => {
    let role = 'pharmacy_owner'
    
    // Same logic as sidebar
    if (email === 'abdousentore@gmail.com') {
      role = 'superadmin'
    } else {
      // Would check database for other roles
      role = 'pharmacy_owner' // Default
    }

    const getNavigationForRole = () => {
      switch (role) {
        case 'superadmin':
          return [
            'Dashboard (/superadmin)',
            'Admin Panel (/admin)', 
            'Pharmacy List (/admin/stores)',
            'Categories (/admin/categories)',
            'Template Designer (/admin/insurance-templates)',
            'Subscriptions (/admin/subscriptions)',
            'Reports (/admin/reports)'
          ]
        case 'pharmacist':
          return [
            'Pharmacist Dashboard (/pharmacist-dashboard)',
            'Prescriptions (/prescriptions)',
            'Inventory (/inventory)',
            'Customers (/customers)'
          ]
        default:
          return [
            'Pharmacy Dashboard (/pharmacy-dashboard)',
            'Inventory (/inventory)',
            'POS (/pos)',
            'Sales (/sales)',
            'Customers (/customers)',
            'Branches (/branches)',
            'Template Designer (/admin/insurance-templates)',
            'Staff Manage (/staff)',
            'Settings (/settings)'
          ]
      }
    }

    return {
      role,
      navigation: getNavigationForRole(),
      roleLabel: role === 'superadmin' ? 'Super Admin' : role === 'pharmacist' ? 'Pharmacist' : 'Pharmacy Owner'
    }
  }

  const handleTest = () => {
    const testResult = testSidebarLogic(testEmail)
    setResult(`
Role: ${testResult.role}
Label: ${testResult.roleLabel}
Navigation:
${testResult.navigation.map(item => `• ${item}`).join('\n')}
    `)
  }

  return (
    <Card className="max-w-2xl mx-auto m-6">
      <CardHeader>
        <CardTitle>Sidebar Role Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Test Email:</label>
          <input
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="Enter email to test"
            className="w-full p-2 border rounded"
          />
        </div>
        
        <div className="flex gap-2">
          <Button onClick={handleTest}>Test Role Detection</Button>
          <Button 
            variant="outline" 
            onClick={() => setTestEmail('abdousentore@gmail.com')}
          >
            Test Super Admin
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setTestEmail('pharmacy@test.com')}
          >
            Test Pharmacy Owner
          </Button>
        </div>

        {result && (
          <div className="mt-4 p-4 bg-gray-100 rounded">
            <h3 className="font-semibold mb-2">Test Result:</h3>
            <pre className="text-sm whitespace-pre-wrap">{result}</pre>
          </div>
        )}

        <div className="mt-6 p-4 bg-blue-50 rounded">
          <h3 className="font-semibold mb-2">Expected Behavior:</h3>
          <ul className="text-sm space-y-1">
            <li>• <strong>abdousentore@gmail.com</strong> → Super Admin sidebar (7 items)</li>
            <li>• <strong>Other emails</strong> → Pharmacy Owner sidebar (9 items) or Pharmacist (4 items)</li>
            <li>• <strong>No subscription card</strong> for Super Admin</li>
            <li>• <strong>Role label</strong> shows "Super Admin" in sidebar header</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}