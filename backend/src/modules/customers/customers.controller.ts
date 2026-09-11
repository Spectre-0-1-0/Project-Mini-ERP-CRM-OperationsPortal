import { Request, Response, NextFunction } from 'express';
import * as customerService from './customers.service.js';

export const listCustomersHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await customerService.listCustomers(req.query as any);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getCustomerByIdHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const customer = await customerService.getCustomerById(id);
    res.status(200).json({
      success: true,
      data: { customer },
    });
  } catch (error) {
    next(error);
  }
};

export const createCustomerHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const customer = await customerService.createCustomer(req.body);
    res.status(201).json({
      success: true,
      data: { customer },
    });
  } catch (error) {
    next(error);
  }
};

export const updateCustomerHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const customer = await customerService.updateCustomer(id, req.body);
    res.status(200).json({
      success: true,
      data: { customer },
    });
  } catch (error) {
    next(error);
  }
};

export const addNoteHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const note = await customerService.addFollowUpNote(id, req.body);
    res.status(201).json({
      success: true,
      data: { note },
    });
  } catch (error) {
    next(error);
  }
};
