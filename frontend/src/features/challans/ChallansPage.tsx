import React, { useState } from 'react';
import { useAuth } from '../../lib/auth-context';
import {
  useChallans,
  useCreateChallan,
  useConfirmChallan,
  useCancelChallan,
  SalesChallan,
} from '../../api/challans.api';
import { useCustomers } from '../../api/customers.api';
import { useProducts, Product } from '../../api/products.api';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Badge, BadgeVariant } from '../../components/ui/Badge';
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
  FileText,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Trash2,
  AlertCircle,
  PackageCheck,
} from 'lucide-react';

interface ChallanLineItemState {
  productId: string;
  quantity: number;
}

export const ChallansPage: React.FC = () => {
  const { hasRole } = useAuth();
  const canEdit = hasRole(['ADMIN', 'SALES']);

  // Filters & Pagination
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [customerFilter, setCustomerFilter] = useState('');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewChallan, setViewChallan] = useState<SalesChallan | null>(null);
  const [confirmChallanTarget, setConfirmChallanTarget] = useState<SalesChallan | null>(null);
  const [cancelChallanTarget, setCancelChallanTarget] = useState<SalesChallan | null>(null);

  // Create Challan Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [lineItems, setLineItems] = useState<ChallanLineItemState[]>([
    { productId: '', quantity: 1 },
  ]);
  const [formError, setFormError] = useState<string | null>(null);

  // Queries & Mutations
  const { data, isLoading, isError, error, refetch } = useChallans({
    page,
    limit: 10,
    status: statusFilter || undefined,
    customerId: customerFilter || undefined,
  });

  const { data: customerData } = useCustomers({ limit: 100 });
  const { data: productData } = useProducts({ limit: 100 });

  const createChallanMutation = useCreateChallan();
  const confirmChallanMutation = useConfirmChallan();
  const cancelChallanMutation = useCancelChallan();

  const productsMap = new Map<string, Product>(
    productData?.items.map((p) => [p.id, p]) || []
  );

  const handleAddLineItem = () => {
    setLineItems([...lineItems, { productId: '', quantity: 1 }]);
  };

  const handleRemoveLineItem = (index: number) => {
    if (lineItems.length <= 1) return;
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: 'productId' | 'quantity', value: any) => {
    const updated = [...lineItems];
    if (field === 'quantity') {
      updated[index].quantity = Math.max(1, parseInt(value, 10) || 1);
    } else {
      updated[index].productId = value;
    }
    setLineItems(updated);
  };

  const handleCreateChallan = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!selectedCustomerId) {
      setFormError('Please select a customer for the challan');
      return;
    }

    const validItems = lineItems.filter((item) => item.productId && item.quantity > 0);
    if (validItems.length === 0) {
      setFormError('Please select at least one valid product line item');
      return;
    }

    try {
      await createChallanMutation.mutateAsync({
        customerId: selectedCustomerId,
        items: validItems,
      });

      setIsCreateModalOpen(false);
      resetCreateForm();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create sales challan');
    }
  };

  const handleConfirmChallanAction = async () => {
    if (!confirmChallanTarget) return;

    try {
      await confirmChallanMutation.mutateAsync(confirmChallanTarget.id);
      setConfirmChallanTarget(null);
      refetch();
    } catch (err: any) {
      alert(err.message || 'Failed to confirm challan');
    }
  };

  const handleCancelChallanAction = async () => {
    if (!cancelChallanTarget) return;

    try {
      await cancelChallanMutation.mutateAsync(cancelChallanTarget.id);
      setCancelChallanTarget(null);
      refetch();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel challan');
    }
  };

  const resetCreateForm = () => {
    setSelectedCustomerId('');
    setLineItems([{ productId: '', quantity: 1 }]);
    setFormError(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Sales Challans</h1>
          <p className="text-xs text-slate-500 mt-0.5">Create draft delivery orders, confirm stock allocations, or cancel orders</p>
        </div>

        {canEdit && (
          <Button
            onClick={() => {
              resetCreateForm();
              setIsCreateModalOpen(true);
            }}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Create Sales Challan
          </Button>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3">
        <div className="w-48">
          <Select
            options={[
              { label: 'All Statuses', value: '' },
              { label: 'Draft', value: 'DRAFT' },
              { label: 'Confirmed', value: 'CONFIRMED' },
              { label: 'Cancelled', value: 'CANCELLED' },
            ]}
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <div className="w-64">
          <Select
            options={[
              { label: 'All Customers', value: '' },
              ...(customerData?.items.map((c) => ({
                label: `${c.name} ${c.businessName ? `(${c.businessName})` : ''}`,
                value: c.id,
              })) || []),
            ]}
            value={customerFilter}
            onChange={(e) => {
              setCustomerFilter(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      {/* Error Banner */}
      {isError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
            <span>{(error as any)?.message || 'Failed to load challans list.'}</span>
          </div>
          <Button size="sm" variant="secondary" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      )}

      {/* Challans Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Challan #</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Total Quantity</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created By</TableHead>
            <TableHead>Date</TableHead>
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
                  title="No Sales Challans found"
                  message="Create your first draft challan to start managing sales dispatches."
                  icon={<FileText className="w-10 h-10 text-slate-400" />}
                />
              </td>
            </tr>
          ) : (
            data.items.map((ch) => (
              <TableRow key={ch.id}>
                <TableCell>
                  <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    {ch.challanNumber}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="font-semibold text-slate-900">{ch.customer?.name || 'N/A'}</div>
                  {ch.customer?.businessName && (
                    <div className="text-xs text-slate-500">{ch.customer.businessName}</div>
                  )}
                </TableCell>
                <TableCell>
                  <span className="font-bold text-slate-900">{ch.totalQuantity} items</span>
                </TableCell>
                <TableCell>
                  <Badge variant={ch.status.toLowerCase() as BadgeVariant} size="sm">
                    {ch.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-xs text-slate-600 font-medium">
                    {ch.createdBy?.name || 'System User'}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-xs text-slate-500">
                    {new Date(ch.createdAt).toLocaleDateString()}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setViewChallan(ch)}
                      leftIcon={<Eye className="w-3.5 h-3.5" />}
                    >
                      View
                    </Button>

                    {canEdit && ch.status === 'DRAFT' && (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => setConfirmChallanTarget(ch)}
                        leftIcon={<CheckCircle className="w-3.5 h-3.5" />}
                      >
                        Confirm
                      </Button>
                    )}

                    {canEdit && (ch.status === 'DRAFT' || ch.status === 'CONFIRMED') && (
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => setCancelChallanTarget(ch)}
                        leftIcon={<XCircle className="w-3.5 h-3.5" />}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </tbody>
      </Table>

      {/* Pagination Controls */}
      {data && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-2 pt-2">
          <p className="text-xs text-slate-500 font-medium">
            Showing <span className="font-bold text-slate-700">{data.items.length}</span> of{' '}
            <span className="font-bold text-slate-700">{data.pagination.total}</span> challans
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

      {/* Create Challan Modal with Low-Stock Product Picker */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Sales Challan (Draft)"
        subtitle="Select customer and line items. Low-stock warnings surface automatically."
        maxWidth="xl"
      >
        <form onSubmit={handleCreateChallan} className="space-y-5">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 font-medium">
              {formError}
            </div>
          )}

          {/* Customer Selection */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Select Customer *
            </label>
            <select
              required
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            >
              <option value="">-- Choose Customer --</option>
              {customerData?.items.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.businessName ? `(${c.businessName})` : ''} - {c.customerType}
                </option>
              ))}
            </select>
          </div>

          {/* Line Items Product Picker */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                Line Items (Products & Quantities) *
              </label>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={handleAddLineItem}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                Add Item Row
              </Button>
            </div>

            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {lineItems.map((item, idx) => {
                const selectedProd = productsMap.get(item.productId);
                const isLowStock = selectedProd && selectedProd.currentStock <= selectedProd.minStock;
                const isExceedingStock = selectedProd && item.quantity > selectedProd.currentStock;

                return (
                  <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <select
                          required
                          value={item.productId}
                          onChange={(e) => handleItemChange(idx, 'productId', e.target.value)}
                          className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                        >
                          <option value="">-- Select Product --</option>
                          {productData?.items.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} [{p.sku}] — Stock: {p.currentStock} (Min: {p.minStock}) — ${Number(p.unitPrice).toFixed(2)}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="w-28">
                        <input
                          type="number"
                          min="1"
                          required
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                          className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 font-bold text-center"
                          placeholder="Qty"
                        />
                      </div>

                      {lineItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveLineItem(idx)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Low Stock Warning Banner in Picker */}
                    {selectedProd && (isLowStock || isExceedingStock) && (
                      <div
                        className={`p-2 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 ${
                          isExceedingStock
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : 'bg-amber-100 text-amber-900 border border-amber-300'
                        }`}
                      >
                        <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>
                          {isExceedingStock
                            ? `WARNING: Requested quantity (${item.quantity}) exceeds available stock (${selectedProd.currentStock}). Confirmation will fail with 409.`
                            : `LOW STOCK ALERT: Item stock is low (${selectedProd.currentStock} left, min threshold is ${selectedProd.minStock}).`}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <div className="text-xs text-slate-600">
              Total Quantity:{' '}
              <span className="font-bold text-slate-900">
                {lineItems.reduce((sum, i) => sum + (i.quantity || 0), 0)} items
              </span>
            </div>

            <div className="flex gap-2">
              <Button type="button" variant="secondary" onClick={() => setIsCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={createChallanMutation.isPending}>
                Create Draft Challan
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* View Challan Detail Modal (Product Snapshot Display) */}
      {viewChallan && (
        <Modal
          isOpen={!!viewChallan}
          onClose={() => setViewChallan(null)}
          title={`Sales Challan ${viewChallan.challanNumber}`}
          subtitle={`Customer: ${viewChallan.customer?.name || 'N/A'} | Status: ${viewChallan.status}`}
          maxWidth="lg"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <div>
                <p className="text-slate-400 font-semibold uppercase">Created Date</p>
                <p className="font-bold text-slate-800 mt-0.5">
                  {new Date(viewChallan.createdAt).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-slate-400 font-semibold uppercase">Created By</p>
                <p className="font-bold text-slate-800 mt-0.5">{viewChallan.createdBy?.name || 'System'}</p>
              </div>
              <div>
                <p className="text-slate-400 font-semibold uppercase">Status</p>
                <Badge variant={viewChallan.status.toLowerCase() as BadgeVariant} size="sm">
                  {viewChallan.status}
                </Badge>
              </div>
            </div>

            {/* Line Item Snapshot List */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                Line Items (Product Snapshots)
              </h3>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">SKU & Product</th>
                      <th className="p-2.5">Unit Price (Snap)</th>
                      <th className="p-2.5 text-right">Quantity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {viewChallan.items?.map((item) => (
                      <tr key={item.id}>
                        <td className="p-2.5">
                          <span className="font-mono font-bold text-slate-900">{item.skuSnap}</span> —{' '}
                          <span className="font-semibold text-slate-800">{item.productNameSnap}</span>
                        </td>
                        <td className="p-2.5 font-medium text-slate-700">
                          ${Number(item.unitPriceSnap).toFixed(2)}
                        </td>
                        <td className="p-2.5 text-right font-bold text-slate-900">{item.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Confirmation Dialog for Confirm Action (Destructive Stock Decrement) */}
      {confirmChallanTarget && (
        <Modal
          isOpen={!!confirmChallanTarget}
          onClose={() => setConfirmChallanTarget(null)}
          title="Confirm Sales Challan?"
          subtitle={`Challan ${confirmChallanTarget.challanNumber}`}
        >
          <div className="space-y-4">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 font-medium flex items-start gap-3">
              <PackageCheck className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Warning: Inventory Allocation</p>
                <p className="mt-0.5 leading-relaxed">
                  Confirming this challan will immediately decrement stock from product inventory and log an OUT stock movement. Insufficient stock will cause confirmation to fail.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button variant="secondary" onClick={() => setConfirmChallanTarget(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                isLoading={confirmChallanMutation.isPending}
                onClick={handleConfirmChallanAction}
              >
                Confirm & Allocate Stock
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Confirmation Dialog for Cancel Action */}
      {cancelChallanTarget && (
        <Modal
          isOpen={!!cancelChallanTarget}
          onClose={() => setCancelChallanTarget(null)}
          title="Cancel Sales Challan?"
          subtitle={`Challan ${cancelChallanTarget.challanNumber}`}
        >
          <div className="space-y-4">
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 font-medium flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Cancel Order Warning</p>
                <p className="mt-0.5 leading-relaxed">
                  Are you sure you want to cancel this challan? If previously CONFIRMED, stock will be automatically restored to inventory and logged as an IN stock movement.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button variant="secondary" onClick={() => setCancelChallanTarget(null)}>
                Go Back
              </Button>
              <Button
                variant="danger"
                isLoading={cancelChallanMutation.isPending}
                onClick={handleCancelChallanAction}
              >
                Yes, Cancel Challan
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
