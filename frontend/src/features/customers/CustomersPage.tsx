import React, { useState } from 'react';
import { useAuth } from '../../lib/auth-context';
import {
  useCustomers,
  useCreateCustomer,
  useAddCustomerNote,
  Customer,
} from '../../api/customers.api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
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
  Search,
  Users,
  ChevronLeft,
  ChevronRight,
  MessageSquarePlus,
  AlertCircle,
  Clock,
} from 'lucide-react';

export const CustomersPage: React.FC = () => {
  const { hasRole } = useAuth();
  const canEdit = hasRole(['ADMIN', 'SALES']);

  // Filters & Pagination State
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Modals State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [noteContent, setNoteContent] = useState('');

  // Form State for Add Customer
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [customerType, setCustomerType] = useState<'RETAIL' | 'WHOLESALE' | 'DISTRIBUTOR'>('WHOLESALE');
  const [address, setAddress] = useState('');
  const [status, setStatus] = useState<'LEAD' | 'ACTIVE' | 'INACTIVE'>('LEAD');
  const [formError, setFormError] = useState<string | null>(null);

  // API Queries & Mutations
  const { data, isLoading, isError, error, refetch } = useCustomers({
    page,
    limit: 10,
    search: search.trim() || undefined,
    status: statusFilter || undefined,
    type: typeFilter || undefined,
  });

  const createCustomerMutation = useCreateCustomer();
  const addNoteMutation = useAddCustomerNote();

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (name.trim().length < 2) {
      setFormError('Customer name must be at least 2 characters');
      return;
    }
    if (mobile.trim().length < 7) {
      setFormError('Mobile number must be at least 7 characters');
      return;
    }

    try {
      await createCustomerMutation.mutateAsync({
        name: name.trim(),
        mobile: mobile.trim(),
        email: email.trim() || null,
        businessName: businessName.trim() || null,
        gstNumber: gstNumber.trim() || null,
        customerType,
        address: address.trim() || null,
        status,
      });

      setIsAddModalOpen(false);
      resetForm();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create customer');
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !noteContent.trim()) return;

    try {
      await addNoteMutation.mutateAsync({
        id: selectedCustomer.id,
        note: noteContent.trim(),
      });

      setNoteContent('');
      setIsNoteModalOpen(false);
      refetch();
    } catch (err: any) {
      alert(err.message || 'Failed to add follow-up note');
    }
  };

  const resetForm = () => {
    setName('');
    setMobile('');
    setEmail('');
    setBusinessName('');
    setGstNumber('');
    setCustomerType('WHOLESALE');
    setAddress('');
    setStatus('LEAD');
    setFormError(null);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Customer CRM</h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage accounts, contact info, and sales follow-up notes</p>
        </div>

        {canEdit && (
          <Button
            onClick={() => {
              resetForm();
              setIsAddModalOpen(true);
            }}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add New Customer
          </Button>
        )}
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[240px] relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            placeholder="Search by name, mobile, email, or business..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
        </div>

        <div className="w-40">
          <Select
            options={[
              { label: 'All Statuses', value: '' },
              { label: 'Lead', value: 'LEAD' },
              { label: 'Active', value: 'ACTIVE' },
              { label: 'Inactive', value: 'INACTIVE' },
            ]}
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <div className="w-40">
          <Select
            options={[
              { label: 'All Types', value: '' },
              { label: 'Wholesale', value: 'WHOLESALE' },
              { label: 'Retail', value: 'RETAIL' },
              { label: 'Distributor', value: 'DISTRIBUTOR' },
            ]}
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      {/* Error State */}
      {isError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
            <span>{(error as any)?.message || 'Failed to load customer list.'}</span>
          </div>
          <Button size="sm" variant="secondary" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      )}

      {/* Table Data View */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Customer / Business</TableHead>
            <TableHead>Contact Info</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <tbody>
          {isLoading ? (
            <TableSkeleton rows={5} cols={6} />
          ) : !data || data.items.length === 0 ? (
            <tr>
              <td colSpan={6}>
                <TableEmpty
                  title="No customers found"
                  message="Try adjusting search or status filters, or add your first customer."
                  icon={<Users className="w-10 h-10 text-slate-400" />}
                />
              </td>
            </tr>
          ) : (
            data.items.map((cust) => (
              <TableRow key={cust.id}>
                <TableCell>
                  <div className="font-semibold text-slate-900">{cust.name}</div>
                  {cust.businessName && (
                    <div className="text-xs text-slate-500 font-medium">{cust.businessName}</div>
                  )}
                </TableCell>
                <TableCell>
                  <div className="text-xs font-semibold text-slate-800">{cust.mobile}</div>
                  {cust.email && <div className="text-xs text-slate-500">{cust.email}</div>}
                </TableCell>
                <TableCell>
                  <Badge variant={cust.customerType.toLowerCase() as BadgeVariant} size="sm">
                    {cust.customerType}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={cust.status.toLowerCase() as BadgeVariant} size="sm">
                    {cust.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-xs text-slate-500">
                    {new Date(cust.createdAt).toLocaleDateString()}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelectedCustomer(cust)}
                    leftIcon={<MessageSquarePlus className="w-3.5 h-3.5 text-brand-600" />}
                  >
                    View Notes
                  </Button>
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
            <span className="font-bold text-slate-700">{data.pagination.total}</span> customers
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

      {/* Add Customer Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Customer"
        subtitle="Create a new customer lead or wholesale account"
      >
        <form onSubmit={handleCreateCustomer} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 font-medium">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Customer Name"
              placeholder="e.g. Rahul Sharma"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              label="Mobile Number"
              placeholder="e.g. 9876543210"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Email Address (Optional)"
              type="email"
              placeholder="rahul@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              label="Business Name (Optional)"
              placeholder="e.g. Apex Traders"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Customer Type"
              options={[
                { label: 'Wholesale', value: 'WHOLESALE' },
                { label: 'Retail', value: 'RETAIL' },
                { label: 'Distributor', value: 'DISTRIBUTOR' },
              ]}
              value={customerType}
              onChange={(e: any) => setCustomerType(e.target.value)}
              required
            />
            <Select
              label="Account Status"
              options={[
                { label: 'Lead', value: 'LEAD' },
                { label: 'Active', value: 'ACTIVE' },
                { label: 'Inactive', value: 'INACTIVE' },
              ]}
              value={status}
              onChange={(e: any) => setStatus(e.target.value)}
              required
            />
          </div>

          <Input
            label="GST Number (Optional)"
            placeholder="e.g. 27AAAAA0000A1Z5"
            value={gstNumber}
            onChange={(e) => setGstNumber(e.target.value)}
          />

          <Input
            label="Address (Optional)"
            placeholder="Complete business address..."
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createCustomerMutation.isPending}>
              Create Account
            </Button>
          </div>
        </form>
      </Modal>

      {/* Customer Detail & Follow-Up Notes Modal */}
      {selectedCustomer && (
        <Modal
          isOpen={!!selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
          title={selectedCustomer.name}
          subtitle={selectedCustomer.businessName || 'Customer Account Detail'}
          maxWidth="lg"
        >
          <div className="space-y-5">
            {/* Account Details Card */}
            <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <div>
                <p className="text-slate-400 font-semibold uppercase">Mobile</p>
                <p className="font-bold text-slate-800 mt-0.5">{selectedCustomer.mobile}</p>
              </div>
              <div>
                <p className="text-slate-400 font-semibold uppercase">Type</p>
                <Badge variant={selectedCustomer.customerType.toLowerCase() as BadgeVariant} size="sm">
                  {selectedCustomer.customerType}
                </Badge>
              </div>
              <div>
                <p className="text-slate-400 font-semibold uppercase">Email</p>
                <p className="font-medium text-slate-800 mt-0.5">{selectedCustomer.email || 'N/A'}</p>
              </div>
              <div>
                <p className="text-slate-400 font-semibold uppercase">GST #</p>
                <p className="font-medium text-slate-800 mt-0.5">{selectedCustomer.gstNumber || 'N/A'}</p>
              </div>
            </div>

            {/* Follow-Up Notes Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Follow-Up Activity Notes
                </h3>
                {canEdit && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setIsNoteModalOpen(true)}
                    leftIcon={<Plus className="w-3.5 h-3.5" />}
                  >
                    Add Note
                  </Button>
                )}
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {!selectedCustomer.notes || selectedCustomer.notes.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-4 text-center bg-slate-50 rounded-lg">
                    No follow-up notes recorded yet.
                  </p>
                ) : (
                  selectedCustomer.notes.map((note) => (
                    <div key={note.id} className="p-3 bg-white border border-slate-200 rounded-lg text-xs">
                      <p className="text-slate-800 font-medium leading-relaxed">{note.note}</p>
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-1">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(note.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Add Follow-Up Note Modal */}
      {isNoteModalOpen && selectedCustomer && (
        <Modal
          isOpen={isNoteModalOpen}
          onClose={() => setIsNoteModalOpen(false)}
          title="Add Follow-Up Note"
          subtitle={`Log sales call or status update for ${selectedCustomer.name}`}
        >
          <form onSubmit={handleAddNote} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Note Details *
              </label>
              <textarea
                rows={4}
                required
                placeholder="Log discussion notes, next steps, or payment updates..."
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                className="w-full p-3 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button type="button" variant="secondary" onClick={() => setIsNoteModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={addNoteMutation.isPending}>
                Save Note
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
