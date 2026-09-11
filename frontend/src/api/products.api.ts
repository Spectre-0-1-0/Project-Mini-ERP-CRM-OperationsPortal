import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../lib/api-client';

export interface Product {
  id: string;
  name: string;
  sku: string;
  category?: string | null;
  unitPrice: number;
  currentStock: number;
  minStock: number;
  location?: string | null;
  createdAt: string;
  updatedAt: string;
  movements?: StockMovement[];
  _count?: {
    movements?: number;
    challanItems?: number;
  };
}

export interface StockMovement {
  id: string;
  productId: string;
  quantity: number;
  type: 'IN' | 'OUT';
  reason: string;
  createdById: string;
  createdAt: string;
  createdBy?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export interface ProductListResponse {
  items: Product[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const useProducts = (params: {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  lowStock?: boolean;
}) => {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.set('page', params.page.toString());
  if (params.limit) queryParams.set('limit', params.limit.toString());
  if (params.search) queryParams.set('search', params.search);
  if (params.category) queryParams.set('category', params.category);
  if (params.lowStock) queryParams.set('lowStock', 'true');

  return useQuery({
    queryKey: ['products', params],
    queryFn: () => apiRequest<ProductListResponse>(`/products?${queryParams.toString()}`),
  });
};

export const useProduct = (id?: string) => {
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => apiRequest<{ product: Product }>(`/products/${id}`).then((res) => res.product),
    enabled: !!id,
  });
};

export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newProduct: {
      name: string;
      sku: string;
      category?: string;
      unitPrice: number;
      initialStock?: number;
      minStock?: number;
      location?: string;
    }) =>
      apiRequest<{ product: Product }>('/products', {
        method: 'POST',
        body: JSON.stringify(newProduct),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Product> }) =>
      apiRequest<{ product: Product }>(`/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product', variables.id] });
    },
  });
};

export const useStockMovements = (productId?: string) => {
  return useQuery({
    queryKey: ['stockMovements', productId],
    queryFn: () =>
      apiRequest<{ product: Product; movements: StockMovement[] }>(`/products/${productId}/stock-movements`),
    enabled: !!productId,
  });
};

export const useCreateStockMovement = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      productId,
      data,
    }: {
      productId: string;
      data: { quantity: number; type: 'IN' | 'OUT'; reason: string };
    }) =>
      apiRequest<{ product: Product; movement: StockMovement }>(`/products/${productId}/stock-movements`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product', variables.productId] });
      queryClient.invalidateQueries({ queryKey: ['stockMovements', variables.productId] });
    },
  });
};
