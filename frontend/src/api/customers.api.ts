import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../lib/api-client';

export interface Customer {
  id: string;
  name: string;
  mobile: string;
  email?: string | null;
  businessName?: string | null;
  gstNumber?: string | null;
  customerType: 'RETAIL' | 'WHOLESALE' | 'DISTRIBUTOR';
  address?: string | null;
  status: 'LEAD' | 'ACTIVE' | 'INACTIVE';
  followUpDate?: string | null;
  notes?: FollowUpNote[];
  createdAt: string;
  updatedAt: string;
  _count?: {
    notes?: number;
    challans?: number;
  };
}

export interface FollowUpNote {
  id: string;
  customerId: string;
  note: string;
  createdAt: string;
}

export interface CustomerListResponse {
  items: Customer[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const useCustomers = (params: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  type?: string;
}) => {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.set('page', params.page.toString());
  if (params.limit) queryParams.set('limit', params.limit.toString());
  if (params.search) queryParams.set('search', params.search);
  if (params.status) queryParams.set('status', params.status);
  if (params.type) queryParams.set('type', params.type);

  return useQuery({
    queryKey: ['customers', params],
    queryFn: () => apiRequest<CustomerListResponse>(`/customers?${queryParams.toString()}`),
  });
};

export const useCustomer = (id?: string) => {
  return useQuery({
    queryKey: ['customer', id],
    queryFn: () => apiRequest<{ customer: Customer }>(`/customers/${id}`).then((res) => res.customer),
    enabled: !!id,
  });
};

export const useCreateCustomer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newCustomer: Partial<Customer>) =>
      apiRequest<{ customer: Customer }>('/customers', {
        method: 'POST',
        body: JSON.stringify(newCustomer),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
};

export const useUpdateCustomer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Customer> }) =>
      apiRequest<{ customer: Customer }>(`/customers/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customer', variables.id] });
    },
  });
};

export const useAddCustomerNote = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) =>
      apiRequest<{ note: FollowUpNote }>(`/customers/${id}/notes`, {
        method: 'POST',
        body: JSON.stringify({ note }),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['customer', variables.id] });
    },
  });
};
