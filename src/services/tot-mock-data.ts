// Mock data for ToT (Turnover Tax) Registration Flow
// This is temporary test data until real backend services are available

export interface MockUser {
  nationalId: string;
  dateOfBirth: string;
  firstName: string;
  lastName: string;
  tinNumber?: string; // Only present for users who have TIN
  totRegistered: boolean;
  totRegistrationDate?: string;
}

// Ghanaian first names
const firstNames = [
  'Kwame', 'Kofi', 'Kwabena', 'Yaw', 'Kwaku', 'Ama', 'Abena', 'Akua', 'Yaa', 'Afua',
  'Kwesi', 'Kwadwo', 'Adjoa', 'Adwoa', 'Afia', 'Kojo', 'Kobina', 'Ekua', 'Esi', 'Efua',
  'Nana', 'Agyei', 'Mensah', 'Agyeman', 'Asante', 'Osei', 'Owusu', 'Boateng', 'Sarpong', 'Frimpong'
];

// Ghanaian last names
const lastNames = [
  'Mensah', 'Asante', 'Osei', 'Owusu', 'Boateng', 'Appiah', 'Agyei', 'Agyeman', 'Sarpong', 'Frimpong',
  'Adjei', 'Amoah', 'Gyasi', 'Ofori', 'Darko', 'Acheampong', 'Wiredu', 'Nkrumah', 'Bonsu', 'Oppong',
  'Kyei', 'Antwi', 'Boakye', 'Asamoah', 'Badu', 'Akoto', 'Yeboah', 'Amponsah', 'Nyarko', 'Dei'
];

// Generate a random TIN number
const generateTin = (): string => {
  const randomNum = Math.floor(Math.random() * 90000000) + 10000000;
  return `TIN${randomNum}`;
};

// Base test data provided by user
const baseTestData = [
  { id_number: "22957832", date_of_birth: "1980-06-22" },
  { id_number: "2206083", date_of_birth: "1958-07-01" },
  { id_number: "26256450", date_of_birth: "1989-01-01" },
  { id_number: "291020916", date_of_birth: "1993-04-29" },
  { id_number: "20720990", date_of_birth: "1977-04-07" },
  { id_number: "22846827", date_of_birth: "1980-07-01" },
  { id_number: "22132474", date_of_birth: "1980-01-01" },
  { id_number: "25444763", date_of_birth: "1984-01-01" },
  { id_number: "20787989", date_of_birth: "1978-03-02" },
  { id_number: "26935939", date_of_birth: "1976-07-01" },
  { id_number: "27507943", date_of_birth: "1986-07-01" },
  { id_number: "27554904", date_of_birth: "1990-03-07" },
  { id_number: "21354657", date_of_birth: "1975-07-01" },
  { id_number: "27514013", date_of_birth: "1989-04-14" },
  { id_number: "27506542", date_of_birth: "1988-01-01" },
  { id_number: "24885641", date_of_birth: "1984-03-04" },
  { id_number: "27473406", date_of_birth: "1975-07-01" },
  { id_number: "27633182", date_of_birth: "1989-06-01" },
  { id_number: "27731907", date_of_birth: "1989-06-02" },
  { id_number: "27598753", date_of_birth: "1962-07-01" },
  { id_number: "27786563", date_of_birth: "1986-07-01" },
  { id_number: "27730421", date_of_birth: "1980-07-28" },
  { id_number: "27611515", date_of_birth: "1989-12-10" },
  { id_number: "27765351", date_of_birth: "1990-08-12" },
  { id_number: "27521182", date_of_birth: "1989-07-01" },
  { id_number: "21723830", date_of_birth: "1977-07-01" },
  { id_number: "27727496", date_of_birth: "1983-07-01" },
  { id_number: "27554168", date_of_birth: "1985-09-08" },
  { id_number: "27741920", date_of_birth: "1990-07-01" },
  { id_number: "27657174", date_of_birth: "1988-05-21" },
  { id_number: "27667324", date_of_birth: "1988-07-01" },
  { id_number: "20482983", date_of_birth: "1976-07-01" },
  { id_number: "27617352", date_of_birth: "1987-07-01" },
  { id_number: "27658960", date_of_birth: "1990-07-01" },
  { id_number: "26372995", date_of_birth: "1988-09-30" },
  { id_number: "20716079", date_of_birth: "1972-07-01" },
  { id_number: "20363704", date_of_birth: "1977-07-01" },
  { id_number: "27776269", date_of_birth: "1989-06-20" },
  { id_number: "27797632", date_of_birth: "1990-09-12" },
  { id_number: "22750683", date_of_birth: "1980-10-20" },
  { id_number: "27562266", date_of_birth: "1990-07-01" },
  { id_number: "27637298", date_of_birth: "1989-04-15" },
  { id_number: "27572876", date_of_birth: "1980-07-01" },
  { id_number: "27551565", date_of_birth: "1965-07-01" },
  { id_number: "27546088", date_of_birth: "1988-06-01" },
  { id_number: "24925810", date_of_birth: "1986-07-01" },
  { id_number: "27644913", date_of_birth: "1979-07-01" },
  { id_number: "25758371", date_of_birth: "1988-01-12" },
  { id_number: "27607871", date_of_birth: "1988-04-14" },
  { id_number: "27750418", date_of_birth: "1989-07-01" }
];

// Initialize mock users
// First 25 users have TIN (Branch A flow)
// Last 25 users don't have TIN (Branch B flow)
export const mockUsers: MockUser[] = baseTestData.map((data, index) => {
  const hasTin = index < 25; // First half has TIN
  const firstName = firstNames[index % firstNames.length];
  const lastName = lastNames[index % lastNames.length];
  
  return {
    nationalId: data.id_number,
    dateOfBirth: data.date_of_birth,
    firstName,
    lastName,
    tinNumber: hasTin ? generateTin() : undefined,
    totRegistered: hasTin
  };
});

// Import Prisma for database operations
import prisma from './prisma.service';

// Helper functions for mock data operations
export const findUserByNationalId = async (nationalId: string, yearOfBirth: string, phoneNumber?: string): Promise<MockUser | null> => {
  // First, check mock data
  const mockUser = mockUsers.find(user => {
    const userYear = new Date(user.dateOfBirth).getFullYear().toString();
    return user.nationalId === nationalId && userYear === yearOfBirth;
  });
  
  if (mockUser) {
    return mockUser;
  }
  
  // If not in mock data, check database
  try {
    const dbUser = await prisma.user.findFirst({
      where: {
        nationalId: nationalId,
        dateOfBirth: {
          gte: new Date(`${yearOfBirth}-01-01`),
          lt: new Date(`${parseInt(yearOfBirth) + 1}-01-01`)
        }
      }
    });
    
    if (dbUser) {
      // Convert database user to MockUser format
      return {
        nationalId: dbUser.nationalId!,
        dateOfBirth: dbUser.dateOfBirth!.toISOString().split('T')[0],
        firstName: dbUser.firstName || '',
        lastName: dbUser.lastName || '',
        tinNumber: dbUser.tinNumber || undefined,
        totRegistered: dbUser.totRegistered,
        totRegistrationDate: dbUser.totRegistrationDate?.toISOString()
      };
    }
    else{
      if (!phoneNumber) {
        throw new Error('Phone number is required for new users');
      }
      // Create a new user
      const newUser = await prisma.user.create({
        data: {
          phoneNumber,
          nationalId,
          dateOfBirth: new Date(`${yearOfBirth}-01-01`),
          firstName:"",
          lastName: '',
          tinNumber: generateTin(),
          totRegistered: false
        }
       
      });
      
      // Convert database user to MockUser format
      return {
        nationalId: newUser.nationalId!,
        dateOfBirth: newUser.dateOfBirth!.toISOString().split('T')[0],
        firstName: newUser.firstName || '',
        lastName: newUser.lastName || '',
        tinNumber: newUser.tinNumber || undefined,
        totRegistered: newUser.totRegistered,
        totRegistrationDate: newUser.totRegistrationDate?.toISOString()
      };
    }
  } catch (error) {
    console.error('Database error in findUserByNationalId:', error);
  }
  
  return null;
};

export const assignTinToUser = async (nationalId: string, firstName: string, yearOfBirth: string): Promise<string | null> => {
  const user = await findUserByNationalId(nationalId, yearOfBirth);
  
  // If user not found in mock or database, create new user in database
  if (!user) {
    try {
      const newTin = generateTin();
      const dateOfBirth = new Date(`${yearOfBirth}-01-01`);
      
      await prisma.user.create({
        data: {
          nationalId,
          dateOfBirth,
          firstName,
          lastName: '', // Will be updated later if needed
          phoneNumber: `+233${Math.floor(Math.random() * 1000000000)}`, // Temporary unique phone
          tinNumber: newTin,
          totRegistered: false
        }
      });
      
      return newTin;
    } catch (error) {
      console.error('Error creating user in database:', error);
      return null;
    }
  }
  
  // Check if user is from mock data
  const isMockUser = mockUsers.some(u => u.nationalId === nationalId);
  
  if (isMockUser) {
    // Update mock user
    const mockUser = mockUsers.find(u => u.nationalId === nationalId);
    if (mockUser) {
      if (firstName) mockUser.firstName = firstName;
      const newTin = generateTin();
      mockUser.tinNumber = newTin;
      return newTin;
    }
  } else {
    // Update database user
    try {
      const newTin = generateTin();
      await prisma.user.update({
        where: { nationalId },
        data: {
          tinNumber: newTin,
          firstName: firstName
        }
      });
      return newTin;
    } catch (error) {
      console.error('Error updating user TIN in database:', error);
      return null;
    }
  }
  
  return null;
};

export const registerUserForTot = async (nationalId: string, yearOfBirth: string): Promise<boolean> => {
  const user = await findUserByNationalId(nationalId, yearOfBirth);
  if (!user || !user.tinNumber) return false;
  
  // Check if user is from mock data
  const isMockUser = mockUsers.some(u => u.nationalId === nationalId);
  
  if (isMockUser) {
    // Update mock user
    const mockUser = mockUsers.find(u => u.nationalId === nationalId);
    if (mockUser) {
      mockUser.totRegistered = true;
      mockUser.totRegistrationDate = new Date().toISOString();
      return true;
    }
  } else {
    // Update database user
    try {
      await prisma.user.update({
        where: { nationalId },
        data: {
          totRegistered: true,
          totRegistrationDate: new Date()
        }
      });
      return true;
    } catch (error) {
      console.error('Error registering user for ToT in database:', error);
      return false;
    }
  }
  
  return false;
};

export const getUserTotStatus = async (nationalId: string, yearOfBirth: string): Promise<{ registered: boolean; date?: string }> => {
  const user = await findUserByNationalId(nationalId, yearOfBirth);
  if (!user) return { registered: false };
  
  return {
    registered: user.totRegistered,
    date: user.totRegistrationDate
  };
};

// ========================================
// ToT FILING & PAYMENT FUNCTIONALITY
// ========================================

export type FilingType = 'DAILY' | 'MONTHLY';
export type PaymentStatus = 'PENDING' | 'PAID';

export interface FilingRecord {
  id: string;
  nationalId: string;
  firstName: string;
  lastName: string;
  tinNumber: string;
  grossSales: number;
  taxRate: number; // 3%
  taxDue: number;
  filingType: FilingType;
  filingPeriod: string; // e.g., "26 Nov 2025" or "November 2025"
  prn: string; // Payment Reference Number
  filedAt: string;
  paymentStatus: PaymentStatus;
}

// Constants
export const TOT_TAX_RATE = 3; // 3% tax rate
const PRN_PREFIX = 'GRA-';

// In-memory filing records storage
export const filingRecords: FilingRecord[] = [];

// Generate PRN (Payment Reference Number)
let prnCounter = 1;
export const generatePRN = (): string => {
  const paddedNumber = String(prnCounter++).padStart(6, '0');
  return `${PRN_PREFIX}${paddedNumber}`;
};

// Calculate tax (3% of gross sales)
export const calculateTotTax = (grossSales: number): number => {
  return Math.round((grossSales * TOT_TAX_RATE / 100) * 100) / 100; // Round to 2 decimal places
};

// Generate daily periods (last 30 days)
export const generateDailyPeriods = (): string[] => {
  const periods: string[] = [];
  const today = new Date();
  
  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    
    const day = date.getDate();
    const month = date.toLocaleString('en-GB', { month: 'short' });
    const year = date.getFullYear();
    
    periods.push(`${day} ${month} ${year}`);
  }
  
  return periods;
};

// Generate monthly periods (last 12 months)
export const generateMonthlyPeriods = (): string[] => {
  const periods: string[] = [];
  const today = new Date();
  
  for (let i = 0; i < 12; i++) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const month = date.toLocaleString('en-GB', { month: 'long' });
    const year = date.getFullYear();
    
    periods.push(`${month} ${year}`);
  }
  
  return periods;
};

// Get available periods for a user (excluding already filed periods)
export const getAvailablePeriodsForUser = async (
  nationalId: string,
  yearOfBirth: string,
  filingType: FilingType
): Promise<string[]> => {
  // Get user's filed periods
  const userFilings = filingRecords.filter(
    record => record.nationalId === nationalId && record.filingType === filingType
  );
  const filedPeriods = new Set(userFilings.map(f => f.filingPeriod));
  
  // Generate all periods and filter out filed ones
  const allPeriods = filingType === 'DAILY' 
    ? generateDailyPeriods() 
    : generateMonthlyPeriods();
  
  return allPeriods.filter(period => !filedPeriods.has(period));
};

// Check if a period has already been filed
export const isPeriodFiled = (
  nationalId: string,
  filingType: FilingType,
  period: string
): boolean => {
  return filingRecords.some(
    record => 
      record.nationalId === nationalId && 
      record.filingType === filingType && 
      record.filingPeriod === period
  );
};

// File a new return
export const fileNewReturn = async (
  nationalId: string,
  yearOfBirth: string,
  grossSales: number,
  filingType: FilingType,
  filingPeriod: string
): Promise<FilingRecord | null> => {
  const user = await findUserByNationalId(nationalId, yearOfBirth);
  
  if (!user || !user.tinNumber) return null;
  
  // Check if period already filed
  if (isPeriodFiled(nationalId, filingType, filingPeriod)) {
    return null;
  }
  
  const taxDue = calculateTotTax(grossSales);
  const prn = generatePRN();
  
  const filingRecord: FilingRecord = {
    id: `filing-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    nationalId: user.nationalId,
    firstName: user.firstName,
    lastName: user.lastName,
    tinNumber: user.tinNumber,
    grossSales,
    taxRate: TOT_TAX_RATE,
    taxDue,
    filingType,
    filingPeriod,
    prn,
    filedAt: new Date().toISOString(),
    paymentStatus: 'PENDING'
  };
  
  filingRecords.push(filingRecord);
  
  return filingRecord;
};

// Get filing history for a user
export const getFilingHistoryForUser = async (
  nationalId: string,
  yearOfBirth: string
): Promise<FilingRecord[]> => {
  const user = await findUserByNationalId(nationalId, yearOfBirth);
  if (!user) return [];
  
  return filingRecords
    .filter(record => record.nationalId === nationalId)
    .sort((a, b) => new Date(b.filedAt).getTime() - new Date(a.filedAt).getTime());
};

// Get return details by PRN
export const getReturnByPRN = (prn: string): FilingRecord | undefined => {
  return filingRecords.find(record => record.prn === prn);
};

// Update payment status (for future use)
export const updatePaymentStatus = (prn: string, status: PaymentStatus): boolean => {
  const record = filingRecords.find(r => r.prn === prn);
  if (!record) return false;
  
  record.paymentStatus = status;
  return true;
};
