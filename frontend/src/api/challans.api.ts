import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../lib/api-client';
import { Customer } from './customers.api';
import { Product } from './products.api';

export interface ChallanItem {
  id: string;
  challanId: string;
  productId: string;
  productNameSnap: string;
  skuSnap: string;
  unitPriceSnap: number;
  quantity: number;
  product?: Product;
}

export interface SalesChallan {
  id: string;
  challanNumber: string;
  customerId: string;
  totalQuantity: number;
  status: 'DRAFT' | 'CONFIRMED' | 'CANCELLED';
  createdById: string;
  createdAt: string;
  updatedAt: string;
  customer?: Customer;
  items?: ChallanItem[];
  createdBy?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  _count?: {
    items?: number;
  };
}

export interface ChallanListResponse {
  items: SalesChallan[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const useChallans = (params: {
  page?: number;
  limit?: number;
  status?: string;
  customerId?: string;
}) => {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.set('page', params.page.toString());
  if (params.limit) queryParams.set('limit', params.limit.toString());
  if (params.status) queryParams.set('status', params.status);
  if (params.customerId) queryParams.set('customerId', params.customerId);

  return useQuery({
    queryKey: ['challans', params],
    queryFn: () => apiRequest<ChallanListResponse>(`/challans?${queryParams.toString()}`),
  });
};

export const useChallan = (id?: string) => {
  return useQuery({
    queryKey: ['challan', id],
    queryFn: () => apiRequest<{ challan: SalesChallan }>(`/challans/${id}`).then((res) => res.challan),
    enabled: !!id,
  });
};

export const useCreateChallan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newChallan: {
      customerId: string;
      items: { productId: string; quantity: number }[];
    }) =>
      apiRequest<{ challan: SalesChallan }>('/challans', {
        method: 'POST',
        body: JSON.stringify(newChallan),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challans'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

export const useConfirmChallan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiRequest<{ challan: SalesChallan }>(`/challans/${id}/confirm`, {
        method: 'POST',
      }),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['challans'] });
      queryClient.invalidateQueries({ queryKey: ['challan', id] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

export const useCancelChallan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiRequest<{ challan: SalesChallan }>(`/challans/${id}/cancel`, {
        method: 'POST',
      }),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['challans'] });
      queryClient.invalidateQueries({ queryKey: ['challan', id] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};
