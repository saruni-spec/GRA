import { Request, Response } from 'express';
import {
  findUserByNationalId,
  assignTinToUser,
  registerUserForTot,
  getUserTotStatus,
  MockUser,
  FilingType,
  getAvailablePeriodsForUser,
  calculateTotTax,
  TOT_TAX_RATE,
  fileNewReturn,
  getFilingHistoryForUser,
  getReturnByPRN
} from '../services/tot-mock-data';
import prisma from '../services/prisma.service';
import { PdfGeneratorService } from '../services/workflow/pdf-generator.service';

/**
 * Register a new user with National ID, Phone Number, and Year of Birth
 * POST /api/v1/tot/register-user
 * Body: { nationalId: string, phoneNumber: string, yearOfBirth: string }
 */
export const registerUser = async (req: Request, res: Response) => {
  try {
    const { nationalId, phoneNumber, yearOfBirth } = req.body;

    // Validation
    if (!nationalId || !phoneNumber || !yearOfBirth) {
      return res.status(400).json({
        success: false,
        error: 'National ID, Phone Number, and Year of Birth are required'
      });
    }

    // Validate phone number format (basic check)
    if (!phoneNumber.startsWith('+233') && !phoneNumber.startsWith('0')) {
      // return res.status(400).json({
      //   success: false,
      //   error: 'Phone number must be a valid Ghanaian number (starting with +233 or 0)'
      // });
      console.log('Phone number must be a valid Ghanaian number (starting with +233 or 0)');
    }

    // Normalize phone number to E.164 format
    let normalizedPhone = phoneNumber;
    if (phoneNumber.startsWith('0')) {
      normalizedPhone = '+233' + phoneNumber.substring(1);
    }

    // Check if user already exists with this national ID
    const existingUser = await prisma.user.findUnique({
      where: { nationalId }
    });

     const dateOfBirth = new Date(`${yearOfBirth}-01-01`);

    if (existingUser) {
      //Upate the user
      await prisma.user.update({
        where: { phoneNumber:phoneNumber },
        data: {
         nationalId,
         dateOfBirth
        }
      });
    }

    // Check if phone number is already in use
    const phoneExists = await prisma.user.findUnique({
      where: { phoneNumber: normalizedPhone }
    });

    if (phoneExists) {
      return res.status(400).json({
        success: false,
        error: 'Phone number is already registered'
      });
    }

    // Create user in database
    const newUser = await prisma.user.create({
      data: {
        nationalId,
        phoneNumber: normalizedPhone,
        dateOfBirth,
        firstName: '', // Optional, can be updated later
        lastName: '', // Optional, can be updated later
        totRegistered: false
      }
    });

    return res.status(201).json({
      success: true,
      message: '✅ User registered successfully! You can now proceed with TIN registration.',
      user: {
        id: newUser.id,
        nationalId: newUser.nationalId,
        phoneNumber: newUser.phoneNumber,
        yearOfBirth: yearOfBirth,
        createdAt: newUser.createdAt
      }
    });
  } catch (error) {
    console.error('Error in registerUser:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * Check if a user has a TIN based on National ID and Year of Birth
 * POST /api/v1/tot/check-tin
 * Body: { nationalId: string, yearOfBirth: string }
 */
export const checkTinStatus = async (req: Request, res: Response) => {
  try {
    console.log('Checking TIN status for user', req.body);
    const { nationalId, yearOfBirth, phoneNumber } = req.body;

    // Validation
    if (!nationalId || !yearOfBirth) {
      return res.status(400).json({
        success: false,
        error: 'National ID and Year of Birth are required'
      });
    }

    // Find user in mock data
    const user = await findUserByNationalId(nationalId, yearOfBirth, phoneNumber);

    console.log('User found with provided National ID and Year of Birth',user);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found with provided National ID and Year of Birth'
      });
    }

    console.log('User found with provided National ID and Year of Birth',user.tinNumber);

    // Check if user has TIN
    if (user.tinNumber) {
      return res.json({
        success: true,
        hasTin: true,
        tinNumber: user.tinNumber,
        userDetails: {
          firstName: user.firstName || 'User',
          lastName: user.lastName || 'User',
          nationalId: user.nationalId,
          dateOfBirth: user.dateOfBirth
        }
      });
    } 
  } catch (error) {
    console.error('Error in checkTinStatus:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * Get user details by National ID and Year of Birth
 * POST /api/v1/tot/get-user-details
 * Body: { nationalId: string, yearOfBirth: string }
 */
export const getUserDetails = async (req: Request, res: Response) => {
  try {
    const { nationalId, yearOfBirth } = req.body;

    // Validation
    if (!nationalId || !yearOfBirth) {
      return res.status(400).json({
        success: false,
        error: 'National ID and Year of Birth are required'
      });
    }

    // Find user
    const user = await findUserByNationalId(nationalId, yearOfBirth);

    if (!user) {
      return res.status(404).json({
        success: false,
        found: false,
        error: 'User not found'
      });
    }

    return res.json({
      success: true,
      found: true,
      userDetails: {
        firstName: user.firstName,
        lastName: user.lastName,
        nationalId: user.nationalId,
        dateOfBirth: user.dateOfBirth,
        tinNumber: user.tinNumber,
        totRegistered: user.totRegistered,
        totRegistrationDate: user.totRegistrationDate
      }
    });
  } catch (error) {
    console.error('Error in getUserDetails:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * Register a TIN for a user (Branch B flow)
 * POST /api/v1/tot/register-tin
 * Body: { nationalId: string, firstName: string, yearOfBirth: string }
 */
export const registerTin = async (req: Request, res: Response) => {
  try {
    const { nationalId, firstName, yearOfBirth } = req.body;

    // Validation
    if (!nationalId || !firstName || !yearOfBirth) {
      return res.status(400).json({
        success: false,
        error: 'National ID, First Name, and Year of Birth are required'
      });
    }

    // Check if user exists first
    const existingUser = await findUserByNationalId(nationalId, yearOfBirth);
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found with provided National ID and Year of Birth'
      });
    }

    // Check if user already has TIN
    if (existingUser.tinNumber) {
      return res.status(400).json({
        success: false,
        error: 'User already has a TIN',
        tinNumber: existingUser.tinNumber
      });
    }

    // Assign TIN
    const newTin = await assignTinToUser(nationalId, firstName, yearOfBirth);

    if (!newTin) {
      return res.status(500).json({
        success: false,
        error: 'Failed to register TIN'
      });
    }

    return res.json({
      success: true,
      tinNumber: newTin,
      message: `🎉 Congratulations! Your TIN has been created. Your TIN Number is: ${newTin}`,
      userDetails: {
        firstName: existingUser.firstName,
        lastName: existingUser.lastName,
        nationalId: existingUser.nationalId,
        tinNumber: newTin
      }
    });
  } catch (error) {
    console.error('Error in registerTin:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * Register user for ToT (Turnover Tax)
 * POST /api/v1/tot/register-tot
 * Body: { nationalId: string, yearOfBirth: string }
 */
export const registerTot = async (req: Request, res: Response) => {
  try {
    const { nationalId, yearOfBirth } = req.body;

    // Validation
    if (!nationalId || !yearOfBirth) {
      return res.status(400).json({
        success: false,
        error: 'National ID and Year of Birth are required'
      });
    }

    // Find user
    const user = await findUserByNationalId(nationalId, yearOfBirth);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

  

    // Check if already registered for ToT
    const totStatus = await getUserTotStatus(nationalId, yearOfBirth);
    if (totStatus.registered) {
      return res.status(400).json({
        success: false,
        error: 'User is already registered for ToT',
        registrationDate: totStatus.date
      });
    }

    // Register for ToT
    const registered = await registerUserForTot(nationalId, yearOfBirth);

    if (!registered) {
      return res.status(500).json({
        success: false,
        error: 'Failed to register for ToT'
      });
    }

    return res.json({
      success: true,
      message: `✅ Dear ${user.firstName} ${user.lastName}, Thank you! You're now registered for Turnover Tax (ToT). You can now file your daily or monthly returns anytime.`,
      userDetails: {
        firstName: user.firstName,
        lastName: user.lastName,
        nationalId: user.nationalId,
        totRegistered: true,
        totRegistrationDate: user.totRegistrationDate
      }
    });
  } catch (error) {
    console.error('Error in registerTot:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * Get ToT registration status
 * POST /api/v1/tot/status
 * Body: { nationalId: string, yearOfBirth: string }
 */
export const getTotStatus = async (req: Request, res: Response) => {
  try {
    const { nationalId, yearOfBirth } = req.body;

    // Validation
    if (!nationalId || !yearOfBirth) {
      return res.status(400).json({
        success: false,
        error: 'National ID and Year of Birth are required'
      });
    }

    // Find user
    const user = await findUserByNationalId(nationalId, yearOfBirth);

    if (!user) {
      return res.status(404).json({
        success: false,
        found: false,
        error: 'User not found'
      });
    }

    const totStatus = await getUserTotStatus(nationalId, yearOfBirth);

    return res.json({
      success: true,
      hasTin: !!user.tinNumber,
      tinNumber: user.tinNumber,
      totRegistered: totStatus.registered,
      totRegistrationDate: totStatus.date,
      userDetails: {
        firstName: user.firstName,
        lastName: user.lastName,
        nationalId: user.nationalId
      }
    });
  } catch (error) {
    console.error('Error in getTotStatus:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// ========================================
// ToT FILING & PAYMENT ENDPOINTS
// ========================================

/**
 * Get available filing periods for a user
 * POST /api/v1/tot/available-periods
 * Body: { nationalId: string, yearOfBirth: string, filingType: 'DAILY' | 'MONTHLY' }
 */
export const getAvailablePeriods = async (req: Request, res: Response) => {
  try {
    const { nationalId, yearOfBirth } = req.body;

    let filingType = req.body.filingType;

    filingType = filingType.toUpperCase();

    // Validation
    if (!nationalId || !yearOfBirth || !filingType) {
      return res.status(400).json({
        success: false,
        error: 'National ID, Year of Birth, and Filing Type are required'
      });
    }

    if (filingType !== 'DAILY' && filingType !== 'MONTHLY') {
      return res.status(400).json({
        success: false,
        error: 'Filing Type must be either DAILY or MONTHLY'
      });
    }

    // Check if user exists and has ToT registration
    const user = await findUserByNationalId(nationalId, yearOfBirth);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    if (!user.totRegistered) {
     // update totRegistered to true
     await prisma.user.update({
      where: {
        nationalId: nationalId,
        
      },
      data: {
        totRegistered: true
      }
    });
    }

    // Get available periods
    const periods = await getAvailablePeriodsForUser(nationalId, yearOfBirth, filingType as FilingType);

    return res.json({
      success: true,
      filingType,
      periods,
      totalAvailable: periods.length
    });
  } catch (error) {
    console.error('Error in getAvailablePeriods:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * Calculate ToT tax (3% of gross sales)
 * POST /api/v1/tot/calculate-tax
 * Body: { grossSales: number }
 */
export const calculateTax = async (req: Request, res: Response) => {
  try {
    const { grossSales } = req.body;

    // Validation
    if (grossSales === undefined || grossSales === null) {
      return res.status(400).json({
        success: false,
        error: 'Gross Sales amount is required'
      });
    }

    if (typeof grossSales !== 'number' || grossSales < 0) {
      return res.status(400).json({
        success: false,
        error: 'Gross Sales must be a positive number'
      });
    }

    const taxDue = calculateTotTax(grossSales);

    return res.json({
      success: true,
      grossSales,
      taxRate: TOT_TAX_RATE,
      taxDue,
      currency: 'GHS'
    });
  } catch (error) {
    console.error('Error in calculateTax:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * File a ToT return
 * POST /api/v1/tot/file-return
 * Body: { nationalId, yearOfBirth, grossSales, filingType, filingPeriod }
 */
export const fileReturn = async (req: Request, res: Response) => {
  try {
    const { nationalId, yearOfBirth, filingPeriod } = req.body;

    const filingType = req.body.filingType.toUpperCase();
    const grossSales = Number(req.body.grossSales);
  
    

    // Validation
    if (!nationalId || !yearOfBirth || grossSales === undefined || !filingType || !filingPeriod) {
      return res.status(400).json({
        success: false,
        error: 'All fields are required: nationalId, yearOfBirth, grossSales, filingType, filingPeriod'
      });
    }
    console.log('passed validation nationalId');

    if (filingType !== 'DAILY' && filingType !== 'MONTHLY') {
      return res.status(400).json({
        success: false,
        error: 'Filing Type must be either DAILY or MONTHLY'
      });
    }

    console.log('passed validation filingType');

   

    if (typeof grossSales !== 'number' || grossSales < 0) {
      return res.status(400).json({
        success: false,
        error: 'Gross Sales must be a positive number'
      });
    }

    console.log('passed validation grossSales');

    // Check if user exists and is registered for ToT
    // We need the Prisma user to store the transaction
    const user = await prisma.user.findUnique({
      where: { nationalId }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    console.log('passed validation user');

    if (!user.totRegistered) {
      return res.status(400).json({
        success: false,
        error: 'User is not registered for ToT. Please register first.'
      });
    }

console.log('passed validation totRegistered');

    // File the return
    const filingRecord = await fileNewReturn(nationalId, yearOfBirth, grossSales, filingType as FilingType, filingPeriod);

    if (!filingRecord) {
      return res.status(400).json({
        success: false,
        error: `This period (${filingPeriod}) has already been filed. You can file only once per period.`
      });
    }

    console.log('passed validation filingRecord');

    // --- NEW: Store as Transaction in DB ---
    let pdfUrl: string | undefined;
    try {
      // Create Transaction record
      const taxTransaction = await prisma.transaction.create({
        data: {
          userId: user.id,
          type: 'TAX',
          category: `${filingType} Tax Return`,
          amount: filingRecord.taxDue,
          currency: 'GHS',
          item: filingPeriod,
          units: '1',
          rawText: `PRN: ${filingRecord.prn}`, // Store PRN for reference
          confidenceScore: 1.0
        }
      });
      
      console.log(`Stored tax transaction ${taxTransaction.id} for user ${user.id}`);

      // --- NEW: Generate PDF Receipt ---
      // We reuse the PdfGeneratorService. It expects an array of transactions.
      // We might want to customize the receipt title for taxes later, but for now the generic one works.
      // Or we can add a specific method to PdfGeneratorService for Tax Receipts.
      // For this POC, let's use the existing one.
      
      // Import PdfGeneratorService dynamically or at top. 
      // Since I can't easily add top-level imports with replace_file_content without context, 
      // I'll assume I need to add the import at the top separately or use a dynamic import if supported (but top level is better).
      // I will add the import in a separate step.
      
      // For now, let's assume PdfGeneratorService is imported.
      pdfUrl = await PdfGeneratorService.generateTaxReceipt(taxTransaction, user);
      
    } catch (dbError) {
      console.error('Error storing tax transaction or generating PDF:', dbError);
      // Don't fail the request if just storage/PDF fails, but log it.
    }

    return res.json({
      success: true,
      message: `✅ Dear ${filingRecord.firstName} ${filingRecord.lastName}, Your Turnover Tax return has been filed successfully.`,
      prn: filingRecord.prn,
      pdfUrl, // Return the PDF URL
      returnDetails: {
        sellerName: `${filingRecord.firstName} ${filingRecord.lastName}`,
        sellerTin: filingRecord.tinNumber,
        grossSales: filingRecord.grossSales,
        filingPeriod: filingRecord.filingPeriod,
        filingType: filingRecord.filingType,
        taxRate: filingRecord.taxRate,
        taxDue: filingRecord.taxDue,
        currency: 'GHS',
        prn: filingRecord.prn,
        filedAt: filingRecord.filedAt,
        paymentStatus: filingRecord.paymentStatus
      }
    });
  } catch (error) {
    console.error('Error in fileReturn:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * Get filing history for a user
 * POST /api/v1/tot/filing-history
 * Body: { nationalId: string, yearOfBirth: string }
 */
export const getFilingHistory = async (req: Request, res: Response) => {
  try {
    const { nationalId, yearOfBirth } = req.body;

    // Validation
    if (!nationalId || !yearOfBirth) {
      return res.status(400).json({
        success: false,
        error: 'National ID and Year of Birth are required'
      });
    }

    // Check if user exists
    const user = await findUserByNationalId(nationalId, yearOfBirth);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Get filing history
    const filings = await getFilingHistoryForUser(nationalId, yearOfBirth);

    return res.json({
      success: true,
      totalFilings: filings.length,
      filings: filings.map(f => ({
        id: f.id,
        grossSales: f.grossSales,
        taxDue: f.taxDue,
        filingType: f.filingType,
        filingPeriod: f.filingPeriod,
        prn: f.prn,
        filedAt: f.filedAt,
        paymentStatus: f.paymentStatus
      }))
    });
  } catch (error) {
    console.error('Error in getFilingHistory:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * Get return details by PRN
 * POST /api/v1/tot/return-details
 * Body: { prn: string }
 */
export const getReturnDetails = async (req: Request, res: Response) => {
  try {
    const { prn } = req.body;

    // Validation
    if (!prn) {
      return res.status(400).json({
        success: false,
        error: 'Payment Reference Number (PRN) is required'
      });
    }

    // Get return by PRN
    const filing = getReturnByPRN(prn);

    if (!filing) {
      return res.status(404).json({
        success: false,
        found: false,
        error: 'Return not found with the provided PRN'
      });
    }

    return res.json({
      success: true,
      found: true,
      returnDetails: {
        sellerName: `${filing.firstName} ${filing.lastName}`,
        sellerTin: filing.tinNumber,
        nationalId: filing.nationalId,
        grossSales: filing.grossSales,
        filingPeriod: filing.filingPeriod,
        filingType: filing.filingType,
        taxRate: filing.taxRate,
        taxDue: filing.taxDue,
        currency: 'GHS',
        prn: filing.prn,
        filedAt: filing.filedAt,
        paymentStatus: filing.paymentStatus
      }
    });
  } catch (error) {
    console.error('Error in getReturnDetails:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};
