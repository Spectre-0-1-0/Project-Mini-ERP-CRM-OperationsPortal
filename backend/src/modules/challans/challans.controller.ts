import { Request, Response, NextFunction } from 'express';
import * as challanService from './challans.service.js';

export const listChallansHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await challanService.listChallans(req.query as any);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getChallanByIdHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const challan = await challanService.getChallanById(id);
    res.status(200).json({
      success: true,
      data: { challan },
    });
  } catch (error) {
    next(error);
  }
};

export const createChallanHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const challan = await challanService.createChallan(req.body, userId);
    res.status(201).json({
      success: true,
      data: { challan },
    });
  } catch (error) {
    next(error);
  }
};

export const updateChallanHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const challan = await challanService.updateChallan(id, req.body);
    res.status(200).json({
      success: true,
      data: { challan },
    });
  } catch (error) {
    next(error);
  }
};

export const confirmChallanHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const challan = await challanService.confirmChallan(id, userId);
    res.status(200).json({
      success: true,
      data: { challan },
    });
  } catch (error) {
    next(error);
  }
};

export const cancelChallanHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const challan = await challanService.cancelChallan(id, userId);
    res.status(200).json({
      success: true,
      data: { challan },
    });
  } catch (error) {
    next(error);
  }
};
