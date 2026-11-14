import { Router } from 'express';
import { z } from 'zod';
import * as controller from './bda.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { validateBody } from '../../middleware/validate.js';
import { BDA_STATUSES } from './bda.service.js';

const router = Router();

// All BDA routes require authentication
router.use(authenticate);

// Validation Schemas
const emptyStringToNull = z.preprocess((val) => {
  if (val === '' || val === undefined) return null;
  return val;
}, z.string().nullable().optional());

const createCustomerSchema = z.object({
  customerName: z.string().min(1, 'Customer name is required').max(255),
  companyName: emptyStringToNull,
  phoneNumber: z.string().min(1, 'Phone number is required').max(50),
  email: z.preprocess((val) => {
    if (val === '' || val === undefined) return null;
    return val;
  }, z.string().email('Invalid email address').max(255).nullable().optional()),
  location: emptyStringToNull,
  projectId: z.preprocess((val) => {
    if (val === '' || val === undefined) return null;
    return val;
  }, z.string().uuid('Invalid project ID').nullable().optional()),
  requiredSoftware: z.string().min(1, 'Required software/service description is required'),
  requirements: emptyStringToNull,
  leadSource: emptyStringToNull,
  enquiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Enquiry date must be in YYYY-MM-DD format'),
  followUpStatus: z.enum(BDA_STATUSES as unknown as [string, ...string[]]).optional(),
  remarks: emptyStringToNull,
  nextFollowUpDate: z.preprocess((val) => {
    if (val === '' || val === undefined) return null;
    return val;
  }, z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Next follow-up date must be in YYYY-MM-DD format').nullable().optional()),
});

const updateCustomerSchema = z.object({
  customerName: z.string().min(1).max(255).optional(),
  companyName: emptyStringToNull,
  phoneNumber: z.string().min(1).max(50).optional(),
  email: z.preprocess((val) => {
    if (val === '' || val === undefined) return null;
    return val;
  }, z.string().email('Invalid email address').max(255).nullable().optional()),
  location: emptyStringToNull,
  projectId: z.preprocess((val) => {
    if (val === '' || val === undefined) return null;
    return val;
  }, z.string().uuid('Invalid project ID').nullable().optional()),
  requiredSoftware: z.string().min(1).optional(),
  requirements: emptyStringToNull,
  leadSource: emptyStringToNull,
  enquiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  followUpStatus: z.enum(BDA_STATUSES as unknown as [string, ...string[]]).optional(),
  remarks: emptyStringToNull,
  nextFollowUpDate: z.preprocess((val) => {
    if (val === '' || val === undefined) return null;
    return val;
  }, z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional()),
});

const importSchema = z.object({
  fileBase64: z.string().min(1, 'File content is required'),
});

// Summary & Projects
router.get('/summary', controller.getSummary);
router.get('/projects/search', controller.searchProjects);

// Customer CRUD
router.get('/customers', controller.listCustomers);
router.get('/customers/:customerId', controller.getCustomer);
router.post('/customers', validateBody(createCustomerSchema), controller.createCustomer);
router.patch('/customers/:customerId', validateBody(updateCustomerSchema), controller.updateCustomer);
router.delete('/customers/:customerId', controller.deleteCustomer);

// Excel Export (GET or POST)
router.get('/export', controller.exportCustomers);
router.post('/export', controller.exportCustomers);

// Excel Import
router.post('/import', validateBody(importSchema), controller.importCustomers);

export default router;
