const statusConfig = {
  'Pending Payment Verification': {
    color: 'bg-amber-100 text-amber-800 border border-amber-200',
    icon: '⏳',
    description: 'Your payment receipt is being reviewed by our administrator.',
  },
  'Payment Verified': {
    color: 'bg-blue-100 text-blue-800 border border-blue-200',
    icon: '✓',
    description: 'Your payment has been confirmed. Your order is being prepared.',
  },
  'Preparing': {
    color: 'bg-indigo-100 text-indigo-800 border border-indigo-200',
    icon: '📦',
    description: 'Your items are being prepared for pickup.',
  },
  'Ready for Pickup': {
    color: 'bg-green-100 text-green-800 border border-green-200',
    icon: '🏪',
    description: 'Your order is ready! Please pick it up at the LCCB Bookstore.',
  },
  'Completed': {
    color: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
    icon: '✅',
    description: 'Your order has been picked up. Thank you!',
  },
  'Rejected': {
    color: 'bg-red-100 text-red-800 border border-red-200',
    icon: '✗',
    description: 'Your payment could not be verified. Please contact the bookstore.',
  },
  'Cancelled': {
    color: 'bg-gray-100 text-gray-800 border border-gray-200',
    icon: '✕',
    description: 'This order was cancelled.',
  },
}

export default function OrderStatusBadge({ status, showDescription = true }) {
  const config = statusConfig[status] || {
    color: 'bg-gray-100 text-gray-800 border border-gray-200',
    icon: '?',
    description: 'Unknown status.',
  }

  return (
    <div className="space-y-2">
      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${config.color}`}>
        <span>{config.icon}</span>
        {status}
      </span>
      {showDescription && (
        <p className="text-sm text-gray-600">{config.description}</p>
      )}
    </div>
  )
}

const DEFAULT_STATUS_FLOW = [
  'Pending Payment Verification',
  'Payment Verified',
  'Preparing',
  'Ready for Pickup',
  'Completed',
]

export function StatusTimeline({ statuses, currentStatus }) {
  // Prefer the flow the API sends for this order; fall back to the standard
  // one. Previously the prop was accepted and then ignored, so any order with a
  // non-standard flow was rendered with the wrong steps.
  const allStatuses =
    Array.isArray(statuses) && statuses.length > 0 ? statuses : DEFAULT_STATUS_FLOW

  const currentIndex = allStatuses.indexOf(currentStatus)
  const isRejected = currentStatus === 'Rejected'

  return (
    <div className="space-y-3">
      {allStatuses.map((status, index) => {
        const isCompleted = !isRejected && index <= currentIndex
        const isCurrent = status === currentStatus

        return (
          <div key={status} className="flex items-center space-x-3">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                isCompleted
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-400'
              } ${isCurrent ? 'ring-2 ring-primary-300 ring-offset-2' : ''}`}
            >
              {isCompleted ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <span className="text-xs font-medium">{index + 1}</span>
              )}
            </div>
            <div>
              <p className={`text-sm font-medium ${isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>
                {status}
              </p>
            </div>
          </div>
        )
      })}
      {isRejected && (
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-red-500 text-white shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <p className="text-sm font-medium text-red-600">Rejected</p>
        </div>
      )}
    </div>
  )
}
