import React, { createContext, useContext, useState, useEffect } from 'react';

const translations = {
  ar: {
    // General
    loading: 'جاري التحميل...',
    error: 'حدث خطأ',
    save: 'حفظ',
    cancel: 'إلغاء',
    delete: 'حذف',
    edit: 'تعديل',
    add: 'إضافة',
    search: 'بحث',
    noData: 'لا توجد بيانات',
    confirm: 'تأكيد',
    close: 'إغلاق',
    yes: 'نعم',
    no: 'لا',

    // Status
    statuses: {
      departed_ningbo: 'غادر ميناء نينغبو',
      at_sea: 'في عرض البحر',
      arrived_aqaba: 'وصل ميناء العقبة',
      customs_clearance: 'التخليص الجمركي',
      ready_for_delivery: 'جاهز للتسليم',
      delivered: 'تم التسليم',
    },

    // Tracking page
    trackYourShipment: 'تتبع شحنتك',
    enterTrackingNumber: 'أدخل رقم التتبع',
    trackNow: 'تتبع الآن',
    shipmentInfo: 'معلومات الشحنة',
    trackingNumber: 'رقم التتبع',
    customerName: 'اسم العميل',
    phone: 'رقم الهاتف',
    route: 'مسار الشحن',
    departurePort: 'ميناء المغادرة',
    departureDate: 'تاريخ المغادرة',
    estimatedArrival: 'الوصول المتوقع',
    lastUpdate: 'آخر تحديث',
    shipmentTimeline: 'مراحل الشحنة',
    shipmentImages: 'صور الشحنة',
    notFound: 'الشحنة غير موجودة',
    notFoundDesc: 'تحقق من رقم التتبع وحاول مجدداً',
    contactUs: 'تواصل معنا',
    whatsappSupport: 'دعم واتساب',
    scanQR: 'امسح رمز QR',
    downloadQR: 'تحميل رمز QR',
    notes: 'ملاحظات',

    // Admin
    dashboard: 'لوحة التحكم',
    shipments: 'الشحنات',
    addShipment: 'إضافة شحنة',
    editShipment: 'تعديل الشحنة',
    deleteShipment: 'حذف الشحنة',
    totalShipments: 'إجمالي الشحنات',
    activeShipments: 'الشحنات النشطة',
    deliveredShipments: 'الشحنات المسلمة',
    pendingShipments: 'قيد الانتظار',
    recentActivity: 'آخر النشاطات',
    updateStatus: 'تحديث الحالة',
    uploadImages: 'رفع صور',
    logout: 'تسجيل الخروج',
    adminLogin: 'تسجيل دخول المدير',
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    login: 'دخول',
    images: 'الصور',
    deleteConfirm: 'هل أنت متأكد من الحذف؟',
    statusUpdated: 'تم تحديث الحالة',
    shipmentCreated: 'تم إنشاء الشحنة',
    shipmentDeleted: 'تم حذف الشحنة',
    addNote: 'إضافة ملاحظة',
    selectStatus: 'اختر الحالة',
    dragDropImages: 'اسحب وأفلت الصور هنا أو انقر للاختيار',
    supportedFormats: 'JPG، PNG، WEBP (حد أقصى 5MB)',
    copyLink: 'نسخ الرابط',
    linkCopied: 'تم النسخ!',
  },
  en: {
    loading: 'Loading...',
    error: 'An error occurred',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
    search: 'Search',
    noData: 'No data',
    confirm: 'Confirm',
    close: 'Close',
    yes: 'Yes',
    no: 'No',

    statuses: {
      departed_ningbo: 'Departed Ningbo Port',
      at_sea: 'At Sea',
      arrived_aqaba: 'Arrived Aqaba Port',
      customs_clearance: 'Customs Clearance',
      ready_for_delivery: 'Ready for Delivery',
      delivered: 'Delivered',
    },

    trackYourShipment: 'Track Your Shipment',
    enterTrackingNumber: 'Enter tracking number',
    trackNow: 'Track Now',
    shipmentInfo: 'Shipment Information',
    trackingNumber: 'Tracking Number',
    customerName: 'Customer Name',
    phone: 'Phone Number',
    route: 'Route',
    departurePort: 'Departure Port',
    departureDate: 'Departure Date',
    estimatedArrival: 'Estimated Arrival',
    lastUpdate: 'Last Update',
    shipmentTimeline: 'Shipment Timeline',
    shipmentImages: 'Shipment Images',
    notFound: 'Shipment Not Found',
    notFoundDesc: 'Check the tracking number and try again',
    contactUs: 'Contact Us',
    whatsappSupport: 'WhatsApp Support',
    scanQR: 'Scan QR Code',
    downloadQR: 'Download QR',
    notes: 'Notes',

    dashboard: 'Dashboard',
    shipments: 'Shipments',
    addShipment: 'Add Shipment',
    editShipment: 'Edit Shipment',
    deleteShipment: 'Delete Shipment',
    totalShipments: 'Total Shipments',
    activeShipments: 'Active Shipments',
    deliveredShipments: 'Delivered',
    pendingShipments: 'Pending',
    recentActivity: 'Recent Activity',
    updateStatus: 'Update Status',
    uploadImages: 'Upload Images',
    logout: 'Logout',
    adminLogin: 'Admin Login',
    email: 'Email',
    password: 'Password',
    login: 'Login',
    images: 'Images',
    deleteConfirm: 'Are you sure you want to delete?',
    statusUpdated: 'Status updated',
    shipmentCreated: 'Shipment created',
    shipmentDeleted: 'Shipment deleted',
    addNote: 'Add note',
    selectStatus: 'Select status',
    dragDropImages: 'Drag & drop images here or click to select',
    supportedFormats: 'JPG, PNG, WEBP (max 5MB)',
    copyLink: 'Copy Link',
    linkCopied: 'Copied!',
  }
};

const LangContext = createContext();

export function LangProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('shiptrack_lang') || 'ar');

  useEffect(() => {
    localStorage.setItem('shiptrack_lang', lang);
    document.documentElement.lang = lang;
    if (lang === 'en') {
      document.body.classList.add('ltr');
      document.documentElement.dir = 'ltr';
    } else {
      document.body.classList.remove('ltr');
      document.documentElement.dir = 'rtl';
    }
  }, [lang]);

  const t = (key) => {
    const keys = key.split('.');
    let val = translations[lang];
    for (const k of keys) { val = val?.[k]; }
    return val || key;
  };

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export const useLang = () => useContext(LangContext);
