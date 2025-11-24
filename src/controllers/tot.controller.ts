import { Request, Response } from 'express';
import {
  findUserByNationalId,
  assignTinToUser,
  registerUserForTot,
  getUserTotStatus,
  MockUser
} from '../services/tot-mock-data';

/**
 * Check if a user has a TIN based on National ID and Year of Birth
 * POST /api/v1/tot/check-tin
 * Body: { nationalId: string, yearOfBirth: string }
 */
export const checkTinStatus = async (req: Request, res: Response) => {
  try {
    const { nationalId, yearOfBirth } = req.body;

    // Validation
    if (!nationalId || !yearOfBirth) {
      return res.status(400).json({
        success: false,
        error: 'National ID and Year of Birth are required'
      });
    }

    // Find user in mock data
    const user = findUserByNationalId(nationalId, yearOfBirth);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found with provided National ID and Year of Birth'
      });
    }

    // Check if user has TIN
    if (user.tinNumber) {
      return res.json({
        success: true,
        hasTin: true,
        tinNumber: user.tinNumber,
        userDetails: {
          firstName: user.firstName,
          lastName: user.lastName,
          nationalId: user.nationalId,
          dateOfBirth: user.dateOfBirth
        }
      });
    } else {
      return res.json({
        success: true,
        hasTin: false,
        message: 'No TIN found for this user. Please register for a TIN first.'
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
    const user = findUserByNationalId(nationalId, yearOfBirth);

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
    const existingUser = findUserByNationalId(nationalId, yearOfBirth);
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
    const newTin = assignTinToUser(nationalId, firstName, yearOfBirth);

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
    const user = findUserByNationalId(nationalId, yearOfBirth);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check if user has TIN
    if (!user.tinNumber) {
      return res.status(400).json({
        success: false,
        error: 'User must have a TIN before registering for ToT. Please register for TIN first.'
      });
    }

    // Check if already registered for ToT
    const totStatus = getUserTotStatus(nationalId, yearOfBirth);
    if (totStatus.registered) {
      return res.status(400).json({
        success: false,
        error: 'User is already registered for ToT',
        registrationDate: totStatus.date
      });
    }

    // Register for ToT
    const registered = registerUserForTot(nationalId, yearOfBirth);

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
        tinNumber: user.tinNumber,
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
    const user = findUserByNationalId(nationalId, yearOfBirth);

    if (!user) {
      return res.status(404).json({
        success: false,
        found: false,
        error: 'User not found'
      });
    }

    const totStatus = getUserTotStatus(nationalId, yearOfBirth);

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
