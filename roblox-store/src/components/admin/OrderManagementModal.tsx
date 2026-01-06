import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Eye, CheckCircle, XCircle, Clock, Truck, RefreshCw, X, MessageSquare, Image, ExternalLink, Download, Copy } from 'lucide-react';
import Modal from './Modal';
import { subscribeOrders, updateOrder, addAuditLog, sendNotification, findCustomerIdByEmail } from '../../services/firebase';
import type { Order, OrderStatus } from '../../types';

interface OrderManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const OrderManagementModal: React.FC<OrderManagementModalProps> = ({ isOpen, onClose }) => {
  const { i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<OrderStatus | 'all'>('all');
  const [filterPayment, setFilterPayment] = useState<'all' | 'paypal' | 'gamepass'>('all');
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [internalNote, setInternalNote] = useState('');
    const [viewingImage, setViewingImage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const unsubscribe = subscribeOrders(setOrders);
      setLoading(false);
      return () => unsubscribe();
    }
  }, [isOpen]);

  const statusOptions: OrderStatus[] = ['pending', 'paid', 'needs_verification', 'processing', 'delivered', 'completed', 'failed', 'refunded'];

  const getStatusLabel = (status: OrderStatus) => {
    const labels: Record<OrderStatus, { en: string; ar: string }> = {
      pending: { en: 'Pending', ar: 'قيد الانتظار' },
      paid: { en: 'Paid', ar: 'تم الدفع' },
      needs_verification: { en: 'Needs Verification', ar: 'يحتاج تحقق' },
      processing: { en: 'Processing', ar: 'قيد المعالجة' },
      delivered: { en: 'Delivered', ar: 'تم التسليم' },
      completed: { en: 'Completed', ar: 'مكتمل' },
      failed: { en: 'Failed', ar: 'فشل' },
      refunded: { en: 'Refunded', ar: 'مسترجع' }
    };
    return isArabic ? labels[status].ar : labels[status].en;
  };

  const getStatusColor = (status: OrderStatus) => {
    const colors: Record<OrderStatus, string> = {
      pending: 'bg-yellow-100 text-yellow-700',
      paid: 'bg-blue-100 text-blue-700',
      needs_verification: 'bg-orange-100 text-orange-700',
      processing: 'bg-purple-100 text-purple-700',
      delivered: 'bg-teal-100 text-teal-700',
      completed: 'bg-green-100 text-green-700',
      failed: 'bg-red-100 text-red-700',
      refunded: 'bg-gray-100 text-gray-700'
    };
    return colors[status];
  };

  const getStatusIcon = (status: OrderStatus) => {
    const icons: Record<OrderStatus, React.ReactNode> = {
      pending: <Clock size={14} />,
      paid: <CheckCircle size={14} />,
      needs_verification: <Eye size={14} />,
      processing: <RefreshCw size={14} />,
      delivered: <Truck size={14} />,
      completed: <CheckCircle size={14} />,
      failed: <XCircle size={14} />,
      refunded: <RefreshCw size={14} />
    };
    return icons[status];
  };

    const handleStatusChange = async (order: Order, newStatus: OrderStatus) => {
      try {
        await updateOrder(order.id, { status: newStatus });
        await addAuditLog({
          userId: 'admin',
          username: 'Admin',
          action: `Changed order status from ${order.status} to ${newStatus}`,
          details: `Order ID: ${order.id}`,
          targetType: 'order',
          targetId: order.id,
          previousValue: order.status,
          newValue: newStatus
        });
      
        // Send notification to customer
        let customerId = order.customerInfo.customerId;
      
        // Fallback: find customerId by email if not present (old orders)
        if (!customerId && order.customerInfo.email) {
          customerId = await findCustomerIdByEmail(order.customerInfo.email) || undefined;
        }
      
        if (customerId) {
          const statusLabels: Record<OrderStatus, { ar: string; en: string }> = {
            pending: { ar: 'قيد الانتظار', en: 'Pending' },
            paid: { ar: 'مدفوع', en: 'Paid' },
            needs_verification: { ar: 'يحتاج تحقق', en: 'Needs Verification' },
            processing: { ar: 'قيد المعالجة', en: 'Processing' },
            delivered: { ar: 'تم التسليم', en: 'Delivered' },
            completed: { ar: 'مكتمل', en: 'Completed' },
            failed: { ar: 'فشل', en: 'Failed' },
            refunded: { ar: 'مسترد', en: 'Refunded' }
          };
        
          await sendNotification(
            customerId,
            'order_status',
            'تحديث حالة الطلب',
            'Order Status Update',
            `تم تحديث حالة طلبك #${order.id.slice(-8)} إلى: ${statusLabels[newStatus].ar}`,
            `Your order #${order.id.slice(-8)} status has been updated to: ${statusLabels[newStatus].en}`,
            '/my-orders'
          );
        }
      
        alert(isArabic ? 'تم تحديث حالة الطلب' : 'Order status updated');
      } catch (error) {
        console.error('Error updating order:', error);
        alert(isArabic ? 'حدث خطأ أثناء التحديث' : 'Error updating order');
      }
    };

  const handleAddNote = async () => {
    if (!selectedOrder || !internalNote.trim()) return;
    
    try {
      const existingNotes = selectedOrder.internalNotes || '';
      const newNote = `[${new Date().toLocaleString()}] ${internalNote}`;
      const updatedNotes = existingNotes ? `${existingNotes}\n${newNote}` : newNote;
      
      await updateOrder(selectedOrder.id, { internalNotes: updatedNotes });
      setInternalNote('');
      alert(isArabic ? 'تمت إضافة الملاحظة' : 'Note added');
    } catch (error) {
      console.error('Error adding note:', error);
      alert(isArabic ? 'حدث خطأ' : 'Error adding note');
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerInfo.robloxUsername.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerInfo.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    const matchesPayment = filterPayment === 'all' || order.paymentMethod === filterPayment;
    return matchesSearch && matchesStatus && matchesPayment;
  });

  const orderStats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    completed: orders.filter(o => o.status === 'completed').length,
    failed: orders.filter(o => o.status === 'failed').length
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isArabic ? 'إدارة الطلبات' : 'Order Management'} size="xl">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-50 p-3 rounded-lg text-center">
          <p className="text-2xl font-bold text-gray-800">{orderStats.total}</p>
          <p className="text-sm text-gray-500">{isArabic ? 'إجمالي' : 'Total'}</p>
        </div>
        <div className="bg-yellow-50 p-3 rounded-lg text-center">
          <p className="text-2xl font-bold text-yellow-600">{orderStats.pending}</p>
          <p className="text-sm text-gray-500">{isArabic ? 'قيد الانتظار' : 'Pending'}</p>
        </div>
        <div className="bg-green-50 p-3 rounded-lg text-center">
          <p className="text-2xl font-bold text-green-600">{orderStats.completed}</p>
          <p className="text-sm text-gray-500">{isArabic ? 'مكتمل' : 'Completed'}</p>
        </div>
        <div className="bg-red-50 p-3 rounded-lg text-center">
          <p className="text-2xl font-bold text-red-600">{orderStats.failed}</p>
          <p className="text-sm text-gray-500">{isArabic ? 'فشل' : 'Failed'}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isArabic ? 'بحث برقم الطلب أو اسم المستخدم...' : 'Search by order ID or username...'}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as OrderStatus | 'all')}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
        >
          <option value="all">{isArabic ? 'جميع الحالات' : 'All Status'}</option>
          {statusOptions.map(status => (
            <option key={status} value={status}>{getStatusLabel(status)}</option>
          ))}
        </select>
        <select
          value={filterPayment}
          onChange={(e) => setFilterPayment(e.target.value as 'all' | 'paypal' | 'gamepass')}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
        >
          <option value="all">{isArabic ? 'جميع طرق الدفع' : 'All Payment'}</option>
          <option value="paypal">PayPal</option>
          <option value="gamepass">Game Pass</option>
        </select>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      ) : (
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {isArabic ? 'لا توجد طلبات' : 'No orders found'}
            </div>
          ) : (
                        filteredOrders.map(order => (
                          <div key={order.id} className="p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-3">
                                <span className="font-mono text-sm text-gray-500">#{order.id.slice(-8)}</span>
                                <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                  {getStatusIcon(order.status)}
                                  {getStatusLabel(order.status)}
                                </span>
                                <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
                                  {order.paymentMethod === 'paypal' ? 'PayPal' : 'Game Pass'}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                {/* Proof Image Thumbnail */}
                                {order.proofImage && (
                                  <button
                                    onClick={() => setViewingImage(order.proofImage!)}
                                    className="relative group"
                                    title={isArabic ? 'عرض إثبات الدفع' : 'View payment proof'}
                                  >
                                    <img 
                                      src={order.proofImage} 
                                      alt="Proof" 
                                      className="w-10 h-10 object-cover rounded border-2 border-green-400 hover:border-green-600 transition-colors"
                                    />
                                    <div className="absolute inset-0 bg-black/50 rounded opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                      <Eye size={14} className="text-white" />
                                    </div>
                                  </button>
                                )}
                                <select
                                  value={order.status}
                                  onChange={(e) => handleStatusChange(order, e.target.value as OrderStatus)}
                                  className="text-sm px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                                >
                                  {statusOptions.map(status => (
                                    <option key={status} value={status}>{getStatusLabel(status)}</option>
                                  ))}
                                </select>
                                <button
                                  onClick={() => setSelectedOrder(order)}
                                  className="p-2 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 transition-colors"
                                >
                                  <Eye size={16} />
                                </button>
                              </div>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <div>
                                <p className="text-gray-800 font-medium">{order.customerInfo.robloxUsername}</p>
                                {order.customerInfo.robloxId && (
                                  <p className="text-purple-600 text-xs flex items-center gap-1">
                                    <span className="font-medium">Roblox ID:</span> 
                                    <span className="font-mono">{order.customerInfo.robloxId}</span>
                                    <button 
                                      onClick={() => navigator.clipboard.writeText(order.customerInfo.robloxId || '')}
                                      className="p-0.5 hover:bg-purple-100 rounded"
                                      title={isArabic ? 'نسخ' : 'Copy'}
                                    >
                                      <Copy size={12} />
                                    </button>
                                  </p>
                                )}
                                <p className="text-gray-500">{order.customerInfo.email}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-green-600">${order.total.toFixed(2)}</p>
                                <p className="text-gray-500 text-xs">
                                  {new Date(order.createdAt).toLocaleDateString(isArabic ? 'ar-SA' : 'en-US')}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
          )}
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSelectedOrder(null)} />
          <div className="relative bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-bold text-gray-800">
                {isArabic ? 'تفاصيل الطلب' : 'Order Details'} #{selectedOrder.id.slice(-8)}
              </h4>
              <button onClick={() => setSelectedOrder(null)}>
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            
                        {/* Customer Info */}
                        <div className="bg-gray-50 p-4 rounded-lg mb-4">
                          <h5 className="font-bold text-gray-800 mb-2">{isArabic ? 'معلومات العميل' : 'Customer Info'}</h5>
                          <div className="space-y-2">
                            <p className="flex items-center gap-2">
                              <strong>Roblox Username:</strong> 
                              <span>{selectedOrder.customerInfo.robloxUsername}</span>
                            </p>
                            {selectedOrder.customerInfo.robloxId && (
                              <p className="flex items-center gap-2">
                                <strong>Roblox ID:</strong> 
                                <span className="font-mono bg-purple-100 px-2 py-0.5 rounded text-purple-700">
                                  {selectedOrder.customerInfo.robloxId}
                                </span>
                                <button 
                                  onClick={() => navigator.clipboard.writeText(selectedOrder.customerInfo.robloxId || '')}
                                  className="p-1 hover:bg-gray-200 rounded"
                                  title={isArabic ? 'نسخ' : 'Copy'}
                                >
                                  <Copy size={14} />
                                </button>
                                <a 
                                  href={`https://www.roblox.com/users/${selectedOrder.customerInfo.robloxId}/profile`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1 hover:bg-gray-200 rounded text-blue-600"
                                  title={isArabic ? 'فتح الملف الشخصي' : 'Open Profile'}
                                >
                                  <ExternalLink size={14} />
                                </a>
                              </p>
                            )}
                            <p><strong>Email:</strong> {selectedOrder.customerInfo.email}</p>
                          </div>
                        </div>
            
                        {/* Payment Proof Image */}
                        {selectedOrder.proofImage && (
                          <div className="bg-green-50 p-4 rounded-lg mb-4">
                            <h5 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                              <Image size={16} />
                              {isArabic ? 'إثبات الدفع' : 'Payment Proof'}
                            </h5>
                            <div className="flex items-start gap-4">
                              <button
                                onClick={() => setViewingImage(selectedOrder.proofImage!)}
                                className="relative group"
                              >
                                <img 
                                  src={selectedOrder.proofImage} 
                                  alt="Payment Proof" 
                                  className="w-32 h-32 object-cover rounded-lg border-2 border-green-400 hover:border-green-600 transition-colors"
                                />
                                <div className="absolute inset-0 bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                  <Eye size={24} className="text-white" />
                                </div>
                              </button>
                              <div className="flex flex-col gap-2">
                                <p className="text-sm text-gray-600">
                                  {selectedOrder.proofImageName || (isArabic ? 'صورة إثبات الدفع' : 'Payment proof image')}
                                </p>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => setViewingImage(selectedOrder.proofImage!)}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
                                  >
                                    <Eye size={14} />
                                    {isArabic ? 'عرض' : 'View'}
                                  </button>
                                  <a
                                    href={selectedOrder.proofImage}
                                    download={selectedOrder.proofImageName || 'payment-proof.png'}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-gray-600 text-white rounded-lg text-sm hover:bg-gray-700"
                                  >
                                    <Download size={14} />
                                    {isArabic ? 'تحميل' : 'Download'}
                                  </a>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
            
            {/* Items */}
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <h5 className="font-bold text-gray-800 mb-2">{isArabic ? 'المنتجات' : 'Items'}</h5>
              {selectedOrder.items.map((item, index) => (
                <div key={index} className="flex justify-between py-2 border-b last:border-0">
                  <span>{isArabic ? item.name_ar : item.name_en} x{item.quantity}</span>
                  <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="flex justify-between pt-2 font-bold">
                <span>{isArabic ? 'الإجمالي' : 'Total'}</span>
                <span className="text-green-600">${selectedOrder.total.toFixed(2)}</span>
              </div>
            </div>
            
            {/* Payment Details */}
            {selectedOrder.paymentDetails && (
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <h5 className="font-bold text-gray-800 mb-2">{isArabic ? 'تفاصيل الدفع' : 'Payment Details'}</h5>
                {selectedOrder.paymentDetails.transactionId && (
                  <p><strong>Transaction ID:</strong> {selectedOrder.paymentDetails.transactionId}</p>
                )}
                {selectedOrder.paymentDetails.payerId && (
                  <p><strong>Payer ID:</strong> {selectedOrder.paymentDetails.payerId}</p>
                )}
              </div>
            )}
            
            {/* Internal Notes */}
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <h5 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                <MessageSquare size={16} />
                {isArabic ? 'ملاحظات داخلية' : 'Internal Notes'}
              </h5>
              {selectedOrder.internalNotes && (
                <pre className="text-sm text-gray-600 whitespace-pre-wrap mb-3 bg-white p-2 rounded">
                  {selectedOrder.internalNotes}
                </pre>
              )}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={internalNote}
                  onChange={(e) => setInternalNote(e.target.value)}
                  placeholder={isArabic ? 'أضف ملاحظة...' : 'Add note...'}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
                <button
                  onClick={handleAddNote}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  {isArabic ? 'إضافة' : 'Add'}
                </button>
              </div>
            </div>
            
            {/* Status Change */}
            <div className="flex items-center gap-4">
              <span className="font-medium">{isArabic ? 'تغيير الحالة:' : 'Change Status:'}</span>
              <select
                value={selectedOrder.status}
                onChange={(e) => {
                  handleStatusChange(selectedOrder, e.target.value as OrderStatus);
                  setSelectedOrder({ ...selectedOrder, status: e.target.value as OrderStatus });
                }}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                {statusOptions.map(status => (
                  <option key={status} value={status}>{getStatusLabel(status)}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Image Viewer Modal */}
      {viewingImage && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/80" onClick={() => setViewingImage(null)} />
          <div className="relative max-w-4xl max-h-[90vh] p-4">
            <button
              onClick={() => setViewingImage(null)}
              className="absolute top-2 right-2 z-10 p-2 bg-white/90 rounded-full hover:bg-white transition-colors"
            >
              <X size={24} className="text-gray-800" />
            </button>
            <img 
              src={viewingImage} 
              alt="Payment Proof" 
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
            />
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              <a
                href={viewingImage}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-white/90 rounded-lg hover:bg-white transition-colors text-gray-800"
              >
                <ExternalLink size={18} />
                {isArabic ? 'فتح في تبويب جديد' : 'Open in new tab'}
              </a>
              <a
                href={viewingImage}
                download="payment-proof.png"
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download size={18} />
                {isArabic ? 'تحميل' : 'Download'}
              </a>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default OrderManagementModal;
