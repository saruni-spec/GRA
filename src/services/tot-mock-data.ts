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
    totRegistered: false
  };
});

// Helper functions for mock data operations
export const findUserByNationalId = (nationalId: string, yearOfBirth: string): MockUser | undefined => {
  return mockUsers.find(user => {
    const userYear = new Date(user.dateOfBirth).getFullYear().toString();
    return user.nationalId === nationalId && userYear === yearOfBirth;
  });
};

export const assignTinToUser = (nationalId: string, firstName: string, yearOfBirth: string): string | null => {
  const user = findUserByNationalId(nationalId, yearOfBirth);
  if (!user) return null;
  
  // Update first name if provided
  if (firstName) {
    user.firstName = firstName;
  }
  
  // Generate and assign TIN
  const newTin = generateTin();
  user.tinNumber = newTin;
  
  return newTin;
};

export const registerUserForTot = (nationalId: string, yearOfBirth: string): boolean => {
  const user = findUserByNationalId(nationalId, yearOfBirth);
  if (!user || !user.tinNumber) return false;
  
  user.totRegistered = true;
  user.totRegistrationDate = new Date().toISOString();
  
  return true;
};

export const getUserTotStatus = (nationalId: string, yearOfBirth: string): { registered: boolean; date?: string } => {
  const user = findUserByNationalId(nationalId, yearOfBirth);
  if (!user) return { registered: false };
  
  return {
    registered: user.totRegistered,
    date: user.totRegistrationDate
  };
};
