import LccbLogo from '../assets/LCCB-Logo.jpeg'

export default function Loading({ text = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="relative h-14 w-14 flex items-center justify-center mb-3.5">
        <div className="absolute inset-0 rounded-full border-[2.5px] border-slate-200 border-t-primary-600 border-r-primary-500 animate-spin" />
        <div className="relative h-9 w-9 rounded-full overflow-hidden bg-white shadow-sm ring-1 ring-slate-200 flex items-center justify-center">
          <img src={LccbLogo} alt="LCCB Bookstore" className="h-full w-full object-cover scale-125" />
        </div>
      </div>
      <p className="text-slate-600 text-sm font-semibold">{text}</p>
    </div>
  )
}

export function ProductGridSkeleton({ count = 8 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden animate-pulse"
        >
          <div className="aspect-[4/3] bg-slate-100" />
          <div className="p-4 space-y-3">
            <div className="h-3 w-20 bg-slate-100 rounded-full" />
            <div className="h-4 w-3/4 bg-slate-200 rounded-lg" />
            <div className="h-3 w-1/2 bg-slate-100 rounded-lg" />
            <div className="pt-2 flex items-center justify-between">
              <div className="h-6 w-16 bg-slate-200 rounded-lg" />
              <div className="h-9 w-20 bg-slate-200 rounded-xl" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
