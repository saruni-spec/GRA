import { parsePhoneNumber, PhoneNumber } from 'libphonenumber-js';
import prisma from './prisma.service';

// Ghana mobile carrier prefixes
const GHANA_CARRIERS = {
  '024': 'MTN',
  '054': 'MTN',
  '055': 'MTN',
  '059': 'MTN',
  '020': 'Vodafone',
  '050': 'Vodafone',
  '027': 'AirtelTigo',
  '057': 'AirtelTigo',
  '026': 'AirtelTigo',
  '056': 'AirtelTigo'
} as const;

export interface ValidatedPhone {
  international: string;  // +233244123456
  national: string;       // 0244123456
  carrier: string;        // MTN, Vodafone, AirtelTigo
  valid: boolean;
}

/**
 * Validate and normalize a Ghana phone number
 * @param rawPhone - Raw phone number in any format
 * @returns ValidatedPhone object or null if invalid
 */
export function validateGhanaPhone(rawPhone: string): ValidatedPhone | null {
  if (!rawPhone) return null;

  try {
    // Remove common separators and whitespace
    const cleaned = rawPhone.replace(/[\s\-\(\)]/g, '');
    
    // Parse phone number with Ghana country code
    const phone = parsePhoneNumber(cleaned, 'GH');
    
    // Check if valid
    if (!phone || !phone.isValid()) {
      return null;
    }

    // Get national number (without country code)
    const nationalNumber = phone.nationalNumber;
    
    // Extract prefix (first 3 digits)
    const prefix = nationalNumber.substring(0, 3);
    
    // Check if it's a valid Ghana mobile prefix
    const carrier = GHANA_CARRIERS[prefix as keyof typeof GHANA_CARRIERS];
    if (!carrier) {
      return null; // Not a valid Ghana mobile number
    }

    return {
      international: phone.number as string,  // +233244123456
      national: '0' + nationalNumber,         // 0244123456
      carrier: carrier,
      valid: true
    };
  } catch (error) {
    console.error('Phone validation error:', error);
    return null;
  }
}

/**
 * Normalize phone number to E.164 format
 * @param phone - Phone number string
 * @returns E.164 formatted number or null
 */
export function normalizeToE164(phone: string): string | null {
  const validated = validateGhanaPhone(phone);
  return validated ? validated.international : null;
}

/**
 * Detect carrier from phone number
 * @param phone - Phone number string
 * @returns Carrier name or null
 */
export function detectCarrier(phone: string): string | null {
  const validated = validateGhanaPhone(phone);
  return validated ? validated.carrier : null;
}

/**
 * Check if phone number already exists in database
 * @param phone - Phone number in E.164 format
 * @returns true if duplicate exists
 */
export async function checkDuplicate(phone: string): Promise<boolean> {
  try {
    const existingLead = await prisma.lead.findFirst({
      where: { normalizedPhone: phone }
    });
    
    const existingUser = await prisma.user.findFirst({
      where: { phoneNumber: phone }
    });

    return !!(existingLead || existingUser);
  } catch (error) {
    console.error('Duplicate check error:', error);
    return false;
  }
}

/**
 * Batch validate multiple phone numbers
 * @param phones - Array of raw phone numbers
 * @returns Array of validated phones (nulls filtered out)
 */
export function batchValidate(phones: string[]): ValidatedPhone[] {
  return phones
    .map(phone => validateGhanaPhone(phone))
    .filter((result): result is ValidatedPhone => result !== null);
}
