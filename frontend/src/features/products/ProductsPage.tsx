import React, { useState } from 'react';
import { useAuth } from '../../lib/auth-context';
import {
  useProducts,
  useCreateProduct,
  useStockMovements,
  useCreateStockMovement,
  Product,
} from '../../api/products.api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import {
  Table,
  TableHeader,
  TableHead,
  TableRow,
  TableCell,
  TableEmpty,
  TableSkeleton,
} from '../../components/ui/Table';
import { Modal } from '../../components/ui/Modal';
import {
  Plus,
  Search,
  Package,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  History,
  ArrowUpRight,
  ArrowDownLeft,
  AlertCircle,
  TrendingDown,
} from 'lucide-react';

export const ProductsPage: React.FC = () => {
  const { hasRole } = useAuth();
  const canEdit = hasRole(['ADMIN', 'WAREHOUSE']);

  // Filters & Pagination
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [lowStockFilter, setLowStockFilter] = useState(false);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [stockProduct, setStockProduct] = useState<Product | null>(null);
  const [historyProduct, setHistoryProduct] = useState<Product | null>(null);

  // Add Product Form State
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [prodCategory, setProdCategory] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [initialStock, setInitialStock] = useState('0');
  const [minStock, setMinStock] = useState('5');
  const [location, setLocation] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Stock Movement Form State
  const [movementQty, setMovementQty] = useState('10');
  const [movementType, setMovementType] = useState<'IN' | 'OUT'>('IN');
  const [movementReason, setMovementReason] = useState('');

  // API Queries & Mutations
  const { data, isLoading, isError, error, refetch } = useProducts({
    page,
    limit: 10,
    search: search.trim() || undefined,
    category: category.trim() || undefined,
    lowStock: lowStockFilter,
  });

  const createProductMutation = useCreateProduct();
  const createStockMoveMutation = useCreateStockMovement();
  const { data: historyData, isLoading: isHistoryLoading } = useStockMovements(historyProduct?.id);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const parsedPrice = parseFloat(unitPrice);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      setFormError('Unit price must be a positive number');
      return;
    }

    try {
      await createProductMutation.mutateAsync({
        name: name.trim(),
        sku: sku.trim().toUpperCase(),
        category: prodCategory.trim() || undefined,
        unitPrice: parsedPrice,
        initialStock: parseInt(initialStock, 10) || 0,
        minStock: parseInt(minStock, 10) || 0,
        location: location.trim() || undefined,
      });

      setIsAddModalOpen(false);
      resetAddForm();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create product');
    }
  };

  const handleCreateStockMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockProduct || !movementReason.trim()) return;

    const qty = parseInt(movementQty, 10);
    if (isNaN(qty) || qty <= 0) {
      alert('Movement quantity must be a positive integer');
      return;
    }

    try {
      await createStockMoveMutation.mutateAsync({
        productId: stockProduct.id,
        data: {
          quantity: qty,
          type: movementType,
          reason: movementReason.trim(),
        },
      });

      setStockProduct(null);
      setMovementReason('');
      refetch();
    } catch (err: any) {
      alert(err.message || 'Failed to record stock movement');
    }
  };

  const resetAddForm = () => {
    setName('');
    setSku('');
    setProdCategory('');
    setUnitPrice('');
    setInitialStock('0');
    setMinStock('5');
    setLocation('');
    setFormError(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Products & Inventory</h1>
          <p className="text-xs text-slate-500 mt-0.5">Track SKU stock levels, minimum thresholds, and stock audit logs</p>
        </div>

        {canEdit && (
          <Button
            onClick={() => {
              resetAddForm();
              setIsAddModalOpen(true);
            }}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add New Product
          </Button>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
            <input
              type="text"
              placeholder="Search by SKU, product name, or category..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <input
            type="text"
            placeholder="Filter category..."
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
            className="w-40 px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
        </div>

        {/* Low-Stock Quick Filter Toggle */}
        <button
          type="button"
          onClick={() => {
            setLowStockFilter(!lowStockFilter);
            setPage(1);
          }}
          className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
            lowStockFilter
              ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
              : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Low Stock Items Only</span>
        </button>
      </div>

      {/* Error Alert */}
      {isError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
            <span>{(error as any)?.message || 'Failed to load products list.'}</span>
          </div>
          <Button size="sm" variant="secondary" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      )}

      {/* Product Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>SKU & Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Unit Price</TableHead>
            <TableHead>Current Stock</TableHead>
            <TableHead>Min Stock</TableHead>
            <TableHead>Location</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <tbody>
          {isLoading ? (
            <TableSkeleton rows={5} cols={7} />
          ) : !data || data.items.length === 0 ? (
            <tr>
              <td colSpan={7}>
                <TableEmpty
                  title="No products found"
                  message="No SKU matches your query. Create a new product or reset filters."
                  icon={<Package className="w-10 h-10 text-slate-400" />}
                />
              </td>
            </tr>
          ) : (
            data.items.map((prod) => {
              const isLowStock = prod.currentStock <= prod.minStock;

              return (
                <TableRow key={prod.id} className={isLowStock ? 'bg-amber-50/40' : undefined}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {prod.sku}
                      </span>
                      <span className="font-semibold text-slate-900">{prod.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-slate-600 font-medium">
                      {prod.category || 'General'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="font-bold text-slate-900">
                      ${Number(prod.unitPrice).toFixed(2)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-bold ${
                          isLowStock ? 'text-amber-700 font-extrabold text-sm' : 'text-slate-900'
                        }`}
                      >
                        {prod.currentStock} units
                      </span>
                      {isLowStock && (
                        <Badge variant="lowStock" size="sm">
                          Low Stock
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-slate-500 font-medium">{prod.minStock} units</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-slate-500">{prod.location || 'Warehouse'}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {canEdit && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setStockProduct(prod);
                            setMovementType('IN');
                            setMovementQty('10');
                          }}
                          leftIcon={<TrendingDown className="w-3.5 h-3.5 text-emerald-600" />}
                        >
                          Stock Move
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setHistoryProduct(prod)}
                        leftIcon={<History className="w-3.5 h-3.5 text-slate-500" />}
                      >
                        History
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </tbody>
      </Table>

      {/* Pagination Controls */}
      {data && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-2 pt-2">
          <p className="text-xs text-slate-500 font-medium">
            Showing <span className="font-bold text-slate-700">{data.items.length}</span> of{' '}
            <span className="font-bold text-slate-700">{data.pagination.total}</span> products
          </p>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              leftIcon={<ChevronLeft className="w-4 h-4" />}
            >
              Previous
            </Button>
            <span className="text-xs font-semibold text-slate-600">
              Page {page} of {data.pagination.totalPages}
            </span>
            <Button
              size="sm"
              variant="secondary"
              disabled={page >= data.pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
              rightIcon={<ChevronRight className="w-4 h-4" />}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Product"
        subtitle="Register a new inventory SKU with unit pricing and stock threshold"
      >
        <form onSubmit={handleCreateProduct} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 font-medium">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Product Name"
              placeholder="e.g. Industrial Motor 5HP"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              label="SKU Code"
              placeholder="e.g. MOT-5HP-001"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Category"
              placeholder="e.g. Heavy Machinery"
              value={prodCategory}
              onChange={(e) => setProdCategory(e.target.value)}
            />
            <Input
              label="Unit Price ($)"
              type="number"
              step="0.01"
              placeholder="250.00"
              value={unitPrice}
              onChange={(e) => setUnitPrice(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Initial Stock Quantity"
              type="number"
              min="0"
              value={initialStock}
              onChange={(e) => setInitialStock(e.target.value)}
              required
            />
            <Input
              label="Min Stock Warning Threshold"
              type="number"
              min="0"
              value={minStock}
              onChange={(e) => setMinStock(e.target.value)}
              required
            />
          </div>

          <Input
            label="Storage Location (Optional)"
            placeholder="e.g. Warehouse A, Shelf 12-B"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createProductMutation.isPending}>
              Create Product SKU
            </Button>
          </div>
        </form>
      </Modal>

      {/* Manual Stock Movement Modal */}
      {stockProduct && (
        <Modal
          isOpen={!!stockProduct}
          onClose={() => setStockProduct(null)}
          title="Manual Stock Adjustment"
          subtitle={`Adjust stock for ${stockProduct.name} (${stockProduct.sku}). Current stock: ${stockProduct.currentStock}`}
        >
          <form onSubmit={handleCreateStockMovement} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  Movement Type *
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setMovementType('IN')}
                    className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg border flex items-center justify-center gap-1 transition-all cursor-pointer ${
                      movementType === 'IN'
                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <ArrowDownLeft className="w-3.5 h-3.5" />
                    <span>IN (Add)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMovementType('OUT')}
                    className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg border flex items-center justify-center gap-1 transition-all cursor-pointer ${
                      movementType === 'OUT'
                        ? 'bg-rose-600 text-white border-rose-700 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span>OUT (Deduct)</span>
                  </button>
                </div>
              </div>

              <Input
                label="Quantity"
                type="number"
                min="1"
                value={movementQty}
                onChange={(e) => setMovementQty(e.target.value)}
                required
              />
            </div>

            <Input
              label="Reason for Adjustment"
              placeholder="e.g. Received shipment batch #402, Stock count audit correction..."
              value={movementReason}
              onChange={(e) => setMovementReason(e.target.value)}
              required
            />

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button type="button" variant="secondary" onClick={() => setStockProduct(null)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={createStockMoveMutation.isPending}>
                Record Movement
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Stock Movement Audit History Modal */}
      {historyProduct && (
        <Modal
          isOpen={!!historyProduct}
          onClose={() => setHistoryProduct(null)}
          title={`Stock Movement History — ${historyProduct.sku}`}
          subtitle={`Audit trail for ${historyProduct.name}`}
          maxWidth="lg"
        >
          <div className="space-y-4">
            {isHistoryLoading ? (
              <div className="py-8 text-center text-xs text-slate-500">Loading movement logs...</div>
            ) : !historyData || historyData.movements.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-6 text-center bg-slate-50 rounded-lg">
                No stock movements logged for this product.
              </p>
            ) : (
              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                {historyData.movements.map((move) => (
                  <div
                    key={move.id}
                    className="p-3 bg-white border border-slate-200 rounded-lg text-xs flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`p-2 rounded-lg font-bold flex items-center gap-1 ${
                          move.type === 'IN' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {move.type === 'IN' ? '+' : '-'}{move.quantity}
                      </span>
                      <div>
                        <p className="font-semibold text-slate-900">{move.reason}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          By: <span className="font-semibold text-slate-700">{move.createdBy?.name || 'System'}</span> ({move.createdBy?.role})
                        </p>
                      </div>
                    </div>

                    <span className="text-[11px] text-slate-400 font-medium">
                      {new Date(move.createdAt).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
