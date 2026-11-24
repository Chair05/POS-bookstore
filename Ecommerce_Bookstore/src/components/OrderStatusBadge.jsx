const STATUS_CONFIG = {
  'Pending Payment Verification': {
    color: 'bg-amber-50 text-amber-800 ring-1 ring-amber-200',
    dot: 'bg-amber-500',
    description: 'Your payment receipt is being reviewed by our bookstore staff.',
  },
  'Payment Verified': {
    color: 'bg-blue-50 text-blue-800 ring-1 ring-blue-200',
    dot: 'bg-blue-500',
    description: 'Your payment is confirmed. Your items will be prepared shortly.',
  },
  Preparing: {
    color: 'bg-indigo-50 text-indigo-800 ring-1 ring-indigo-200',
    dot: 'bg-indigo-500',
    description: 'Your items are currently being packed for campus pickup.',
  },
  'Ready for Pickup': {
    color: 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200',
    dot: 'bg-emerald-500',
    description: 'Your order is ready! Please claim it at the LCCB Bookstore counter.',
  },
  Completed: {
    color: 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200',
    dot: 'bg-emerald-600',
    description: 'Your order has been picked up. Thank you for shopping with us!',
  },
  Rejected: {
    color: 'bg-red-50 text-red-800 ring-1 ring-red-200',
    dot: 'bg-red-500',
    description: 'Your payment could not be verified. Please visit or contact the bookstore.',
  },
  Cancelled: {
    color: 'bg-slate-100 text-slate-700 ring-1 ring-slate-200',
    dot: 'bg-slate-400',
    description: 'This order was cancelled.',
  },
}

export default function OrderStatusBadge({ status, showDescription = true }) {
  const config = STATUS_CONFIG[status] || {
    color: 'bg-slate-100 text-slate-700 ring-1 ring-slate-200',
    dot: 'bg-slate-400',
    description: 'Order status updated.',
  }

  return (
    <div className="space-y-2">
      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${config.color}`}>
        <span className={`w-2 h-2 rounded-full ${config.dot}`} />
        {status}
      </span>
      {showDescription && (
        <p className="text-sm text-slate-600">{config.description}</p>
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
  const allStatuses =
    Array.isArray(statuses) && statuses.length > 0 ? statuses : DEFAULT_STATUS_FLOW

  const currentIndex = allStatuses.indexOf(currentStatus)
  const isRejected = currentStatus === 'Rejected'

  return (
    <div className="relative space-y-4">
      {allStatuses.map((status, index) => {
        const isCompleted = !isRejected && index <= currentIndex
        const isCurrent = status === currentStatus
        const isLast = index === allStatuses.length - 1 && !isRejected

        return (
          <div key={status} className="relative flex items-center gap-3.5">
            {!isLast && (
              <div
                className={`absolute left-4 top-8 w-0.5 h-5 -ml-px ${
                  !isRejected && index < currentIndex ? 'bg-primary-500' : 'bg-slate-200'
                }`}
              />
            )}
            <div
              className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all ${
                isCompleted
                  ? 'bg-primary-600 text-white shadow-sm shadow-primary-600/25'
                  : 'bg-slate-100 text-slate-400'
              } ${isCurrent ? 'ring-4 ring-primary-100' : ''}`}
            >
              {isCompleted ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <span className="text-xs font-semibold tabular-nums">{index + 1}</span>
              )}
            </div>
            <div>
              <p className={`text-sm font-semibold ${isCompleted ? 'text-slate-900' : 'text-slate-400'}`}>
                {status}
              </p>
            </div>
          </div>
        )
      })}
      {isRejected && (
        <div className="relative flex items-center gap-3.5">
          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-red-600 text-white shrink-0 ring-4 ring-red-100">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-red-600">Rejected</p>
        </div>
      )}
    </div>
  )
}
