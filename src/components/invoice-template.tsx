'use client'

interface InvoiceData {
  pharmacyName: string
  pharmacyAddress: string
  pharmacyPhone: string
  pharmacyTIN: string
  insuranceName: string
  insurancePercentage: number
  receiptNumber: string
  date: string
  time: string
  sdcId: string
  beneficialNumber: string
  beneficialName: string
  relationship: string
  telephone: string
  affiliateName: string
  dateOfBirth: string
  dutyStation: string
  insuranceTIN: string
  doctorName: string
  mrcCode: string
  items: Array<{
    name: string
    batch: string
    expiryDate: string
    quantity: number
    price: number
    total: number
    insuranceCoverage: number
    patientPortion: number
  }>
  totalAmount: number
  taxAmount: number
  totalWithTax: number
  insuranceAmount: number
  patientAmount: number
  patientPercentage: number
}

interface TemplateConfig {
  showLogo: boolean
  headerFields: string[]
  patientFields: string[]
  productFields: string[]
  showTax: boolean
  showInsuranceSplit: boolean
  footerText: string
}

interface InvoiceTemplateProps {
  data: InvoiceData
  template?: TemplateConfig
}

export function InvoiceTemplate({ data, template }: InvoiceTemplateProps) {
  const config = template || {
    showLogo: true,
    headerFields: ['pharmacyName', 'pharmacyAddress', 'pharmacyPhone', 'date'],
    patientFields: ['beneficialNumber', 'beneficialName', 'telephone', 'insuranceTIN'],
    productFields: ['name', 'batch', 'expiryDate', 'quantity', 'price', 'total'],
    showTax: true,
    showInsuranceSplit: true,
    footerText: ''
  }

  const fieldLabels: Record<string, string> = {
    pharmacyName: 'Pharmacy',
    pharmacyAddress: 'Adresse',
    pharmacyPhone: 'Tél',
    date: 'Date de création',
    beneficialNumber: 'Beneficial N°',
    beneficialName: 'Beneficial Names',
    telephone: 'Telephone N°',
    insuranceTIN: 'Insurance TIN N°'
  }

  const getScalarField = (field: string): string | number => {
    const value = data[field as keyof InvoiceData]
    return typeof value === 'string' || typeof value === 'number' ? value : ''
  }

  const renderField = (field: string) => {
    return <p key={field}>{fieldLabels[field] || field}: {getScalarField(field)}</p>
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white text-black print:p-0">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-xl font-bold">FACTURE DES MEDICAMENTS</h1>
        {config.headerFields.includes('pharmacyName') && <h2 className="text-lg font-semibold mt-2">{data.pharmacyName}</h2>}
        {config.headerFields.map(field => renderField(field))}
      </div>

      {/* Patient Info */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div>
          <h3 className="font-bold mb-2">Informations du bénéficiaire</h3>
          {config.patientFields.map(field => renderField(field))}
        </div>
        
        <div>
          <h3 className="font-bold mb-2">Pharmacie / Détails du dossier</h3>
          <p>Pharmacy: {data.pharmacyName}</p>
          <p>HSP / Médecin: {data.doctorName}</p>
          <p>SDC ID: {data.sdcId}</p>
          <p>Time: {data.time}</p>
          <p>Receipt Number: {data.receiptNumber}</p>
          <p>MRC: {data.mrcCode}</p>
          <p>TIN (Pharmacie): {data.pharmacyTIN}</p>
        </div>
      </div>

      {/* Products Table */}
      <div className="mb-6">
        <h3 className="font-bold mb-2">PRODUITS FOURNIS</h3>
        <table className="w-full border-collapse border border-black text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-black p-1">No.</th>
              <th className="border border-black p-1">PRODUIT</th>
              <th className="border border-black p-1">BATCH</th>
              <th className="border border-black p-1">EXP.</th>
              <th className="border border-black p-1">Qté</th>
              <th className="border border-black p-1">P.U.</th>
              <th className="border border-black p-1">P.T.</th>
              <th className="border border-black p-1">P.A.</th>
              <th className="border border-black p-1">% {data.insuranceName}</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item, index) => (
              <tr key={index}>
                <td className="border border-black p-1 text-center">{index + 1}</td>
                <td className="border border-black p-1">{item.name}</td>
                <td className="border border-black p-1">{item.batch}</td>
                <td className="border border-black p-1">{item.expiryDate}</td>
                <td className="border border-black p-1 text-center">{item.quantity}</td>
                <td className="border border-black p-1 text-right">{item.price.toLocaleString()}</td>
                <td className="border border-black p-1 text-right">{item.total.toLocaleString()}</td>
                <td className="border border-black p-1 text-right">{item.insuranceCoverage.toLocaleString()}</td>
                <td className="border border-black p-1 text-center">{data.insurancePercentage}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      {(config.showTax || config.showInsuranceSplit) && (
        <div className="grid grid-cols-2 gap-6 mb-6">
          {config.showTax && (
            <div>
              <h3 className="font-bold mb-2">Totaux & Taxes</h3>
              <p>TOTAL A-EX: {data.totalAmount.toLocaleString()}</p>
              <p>TOTAL B-18.00%: {data.totalWithTax.toLocaleString()}</p>
              <p>TOTAL TAX B: {data.taxAmount.toLocaleString()}</p>
              <p>TOTAL 100% RWF: {data.totalWithTax.toLocaleString()}</p>
            </div>
          )}
          
          {config.showInsuranceSplit && (
            <div>
              <p>Adhérent {data.patientPercentage}%: {data.patientAmount.toLocaleString()}</p>
              <p>{data.insuranceName} {data.insurancePercentage}%: {data.insuranceAmount.toLocaleString()}</p>
            </div>
          )}
        </div>
      )}

      {/* Signatures */}
      <div className="grid grid-cols-2 gap-6">
        <div>
          <h3 className="font-bold mb-2">Signature et cachet de la pharmacie</h3>
          <p>Signature: ________________</p>
          <p>Date: {data.date}</p>
        </div>
        
        <div>
          <h3 className="font-bold mb-2">Visa {data.insuranceName}</h3>
          <p>Nom: ________________</p>
          <p>Signature: ________________</p>
        </div>
      </div>
      
      {config.footerText && (
        <div className="text-center mt-6 text-sm">
          {config.footerText}
        </div>
      )}
    </div>
  )
}