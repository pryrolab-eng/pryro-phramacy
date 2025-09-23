import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

const resources = {
  en: {
    translation: {
      // Common
      'save': 'Save',
      'cancel': 'Cancel',
      'edit': 'Edit',
      'delete': 'Delete',
      'add': 'Add',
      'search': 'Search',
      'loading': 'Loading...',
      
      // Navigation
      'dashboard': 'Dashboard',
      'inventory': 'Inventory',
      'pos': 'POS',
      'sales': 'Sales',
      'customers': 'Customers',
      'settings': 'Settings',
      
      // Pharmacy
      'pharmacy_name': 'Pharmacy Name',
      'patient_name': 'Patient Name',
      'amount': 'Amount',
      'coverage': 'Coverage',
      'insurance_name': 'Insurance Name',
      'policy_number': 'Policy Number',
      'date': 'Date',
      
      // Currency
      'currency': 'Currency',
      'language': 'Language',
      'system_preferences': 'System Preferences'
    }
  },
  rw: {
    translation: {
      // Common
      'save': 'Bika',
      'cancel': 'Hagarika',
      'edit': 'Hindura',
      'delete': 'Siba',
      'add': 'Ongeraho',
      'search': 'Shakisha',
      'loading': 'Birategereza...',
      
      // Navigation
      'dashboard': 'Ikibaho',
      'inventory': 'Ibicuruzwa',
      'pos': 'Kugurisha',
      'sales': 'Amagurishwa',
      'customers': 'Abakiriya',
      'settings': 'Amagenamiterere',
      
      // Pharmacy
      'pharmacy_name': 'Izina rya Farumasi',
      'patient_name': 'Izina ry\'Umurwayi',
      'amount': 'Amafaranga',
      'coverage': 'Ubwishingizi',
      'insurance_name': 'Izina ry\'Ubwishingizi',
      'policy_number': 'Nimero y\'Ubwishingizi',
      'date': 'Itariki',
      
      // Currency
      'currency': 'Ifaranga',
      'language': 'Ururimi',
      'system_preferences': 'Amahitamo ya Sisitemu'
    }
  },
  fr: {
    translation: {
      // Common
      'save': 'Enregistrer',
      'cancel': 'Annuler',
      'edit': 'Modifier',
      'delete': 'Supprimer',
      'add': 'Ajouter',
      'search': 'Rechercher',
      'loading': 'Chargement...',
      
      // Navigation
      'dashboard': 'Tableau de bord',
      'inventory': 'Inventaire',
      'pos': 'Point de vente',
      'sales': 'Ventes',
      'customers': 'Clients',
      'settings': 'Paramètres',
      
      // Pharmacy
      'pharmacy_name': 'Nom de la pharmacie',
      'patient_name': 'Nom du patient',
      'amount': 'Montant',
      'coverage': 'Couverture',
      'insurance_name': 'Nom de l\'assurance',
      'policy_number': 'Numéro de police',
      'date': 'Date',
      
      // Currency
      'currency': 'Devise',
      'language': 'Langue',
      'system_preferences': 'Préférences système'
    }
  },
  sw: {
    translation: {
      // Common
      'save': 'Hifadhi',
      'cancel': 'Ghairi',
      'edit': 'Hariri',
      'delete': 'Futa',
      'add': 'Ongeza',
      'search': 'Tafuta',
      'loading': 'Inapakia...',
      
      // Navigation
      'dashboard': 'Dashibodi',
      'inventory': 'Hesabu',
      'pos': 'Mauzo',
      'sales': 'Mauzo',
      'customers': 'Wateja',
      'settings': 'Mipangilio',
      
      // Pharmacy
      'pharmacy_name': 'Jina la Famasi',
      'patient_name': 'Jina la Mgonjwa',
      'amount': 'Kiasi',
      'coverage': 'Bima',
      'insurance_name': 'Jina la Bima',
      'policy_number': 'Nambari ya Bima',
      'date': 'Tarehe',
      
      // Currency
      'currency': 'Sarafu',
      'language': 'Lugha',
      'system_preferences': 'Mapendeleo ya Mfumo'
    }
  }
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: false,
    interpolation: {
      escapeValue: false
    }
  })

export default i18n