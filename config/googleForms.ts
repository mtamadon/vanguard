/*
 * config for google forms used in the backoffice
*/
interface GoogleFormsConfig {
  id: string;
  code: string;
  title: string;
  sheetLink?: string;
  prefilledKeys: {
    userId?: string;
    phonenumber?: string;
    imeis?: string;
    imei?: string;
    name?: string;
    supportStaffName: string;
    supportStaffEmail: string;
    supportStaffId: string;
  };
}

export const googleFormsConfigs: GoogleFormsConfig[] = [
  {
    id: '1FAIpQLSeAo08vjOFsAcvCISK1CiiqhxTlq_NpUtp0WMUmru9Yz7XQKg',
    code: 'support',
    title: 'تماس با پشتیبانی',
    sheetLink: "https://docs.google.com/spreadsheets/d/1R0ZCJXz4n8t12JLLS-tU_-mD0V4Ajq08t7liNnOfGNM/",
    prefilledKeys: {
      supportStaffId: 'entry.1443541396',
      supportStaffEmail: 'entry.424454380',
      supportStaffName: 'entry.998506371',
      userId: 'entry.219202047',
      phonenumber: 'entry.18401792',
      name: 'entry.2036004594',
      imei: 'entry.511384302',
    },
  }
]