import { Request, Response } from 'express';
import prisma from '../services/prisma.service';

/**
 * Register a new user with mandatory fields
 * Required: firstName, lastName, phoneNumber
 * Optional: All other fields (email, business details, location, TIN)
 */
export const registerUser = async (req: Request, res: Response) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phoneNumber,
      businessName,
      businessType,
      businessCategory,
      businessDescription,
      location,
      city,
      region,
      gpsLat,
      gpsLng,
      tinNumber
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !phoneNumber) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'firstName, lastName, and phoneNumber are required fields'
      });
    }

    // Normalize phone number (basic validation)
    const normalizedPhone = phoneNumber.startsWith('+') 
      ? phoneNumber 
      : `+${phoneNumber}`;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { phoneNumber: normalizedPhone }
    });

    if (existingUser) {
      return res.status(400).json({
        error: 'User Already Exists',
        message: 'A user with this phone number is already registered'
      });
    }

    // Check if email is already in use (if provided)
    if (email) {
      const existingEmail = await prisma.user.findUnique({
        where: { email }
      });

      if (existingEmail) {
        return res.status(400).json({
          error: 'Email Already Exists',
          message: 'A user with this email is already registered'
        });
      }
    }

    // Create new user
    const newUser = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email: email || null,
        phoneNumber: normalizedPhone,
        businessName: businessName || null,
        businessType: businessType || null,
        businessCategory: businessCategory || null,
        businessDescription: businessDescription || null,
        location: location || null,
        city: city || null,
        region: region || null,
        gpsLat: gpsLat ? parseFloat(gpsLat) : null,
        gpsLng: gpsLng ? parseFloat(gpsLng) : null,
        tinNumber: tinNumber || null
      }
    });

    console.log(`New user registered: ${newUser.id} - ${newUser.phoneNumber}`);

    res.status(201).json({
      status: 'SUCCESS',
      message: 'User registered successfully',
      user: {
        id: newUser.id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        phoneNumber: newUser.phoneNumber,
        businessName: newUser.businessName,
        businessType: newUser.businessType,
        businessCategory: newUser.businessCategory,
        registrationDate: newUser.registrationDate,
        isVerified: newUser.isVerified
      }
    });
  } catch (error) {
    console.error('Error in registerUser:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Failed to register user'
    });
  }
};

/**
 * Update user profile with any additional details
 * Accepts partial updates - only updates fields that are provided
 * Can update single or multiple fields in one request
 */
export const updateUserProfile = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const updateData = req.body;

    // Remove fields that shouldn't be updated directly
    delete updateData.id;
    delete updateData.createdAt;
    delete updateData.updatedAt;
    delete updateData.registrationDate;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      return res.status(404).json({
        error: 'User Not Found',
        message: 'No user found with the provided ID'
      });
    }

    // If email is being updated, check if it's already in use
    if (updateData.email && updateData.email !== existingUser.email) {
      const emailInUse = await prisma.user.findUnique({
        where: { email: updateData.email }
      });

      if (emailInUse) {
        return res.status(400).json({
          error: 'Email Already Exists',
          message: 'This email is already registered to another user'
        });
      }
    }

    // If phone number is being updated, check if it's already in use
    if (updateData.phoneNumber && updateData.phoneNumber !== existingUser.phoneNumber) {
      const normalizedPhone = updateData.phoneNumber.startsWith('+') 
        ? updateData.phoneNumber 
        : `+${updateData.phoneNumber}`;
      
      const phoneInUse = await prisma.user.findUnique({
        where: { phoneNumber: normalizedPhone }
      });

      if (phoneInUse) {
        return res.status(400).json({
          error: 'Phone Number Already Exists',
          message: 'This phone number is already registered to another user'
        });
      }

      updateData.phoneNumber = normalizedPhone;
    }

    // Parse GPS coordinates if provided
    if (updateData.gpsLat) updateData.gpsLat = parseFloat(updateData.gpsLat);
    if (updateData.gpsLng) updateData.gpsLng = parseFloat(updateData.gpsLng);

    // Update user with provided fields
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData
    });

    console.log(`User profile updated: ${updatedUser.id} - Updated fields: ${Object.keys(updateData).join(', ')}`);

    res.status(200).json({
      status: 'SUCCESS',
      message: 'User profile updated successfully',
      updatedFields: Object.keys(updateData),
      user: {
        id: updatedUser.id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        phoneNumber: updatedUser.phoneNumber,
        businessName: updatedUser.businessName,
        businessType: updatedUser.businessType,
        businessCategory: updatedUser.businessCategory,
        businessDescription: updatedUser.businessDescription,
        location: updatedUser.location,
        city: updatedUser.city,
        region: updatedUser.region,
        tinNumber: updatedUser.tinNumber,
        isVerified: updatedUser.isVerified,
        updatedAt: updatedUser.updatedAt
      }
    });
  } catch (error) {
    console.error('Error in updateUserProfile:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Failed to update user profile'
    });
  }
};

/**
 * Get user profile by ID
 */
export const getUserProfile = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        transactions: {
          take: 10,
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        error: 'User Not Found',
        message: 'No user found with the provided ID'
      });
    }

    res.status(200).json({
      status: 'SUCCESS',
      user
    });
  } catch (error) {
    console.error('Error in getUserProfile:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Failed to retrieve user profile'
    });
  }
};



/**
 * Get user profile by whatsapp number
 */
export const getUserProfileByPhone = async (req: Request, res: Response) => {
  try {
    const { phone } = req.params;

    const user = await prisma.user.findUnique({
      where: { phoneNumber:phone },
      include: {
        transactions: {
          take: 10,
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        error: 'User Not Found',
        message: 'No user found with the provided ID'
      });
    }

    res.status(200).json({
      status: 'SUCCESS',
      user
    });
  } catch (error) {
    console.error('Error in getUserProfile:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Failed to retrieve user profile'
    });
  }
};
