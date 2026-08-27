import { useState, useRef, useEffect, useCallback } from 'react'

export default function OtpInput({ length = 6, onComplete, onResend, resendTimer = 60 }) {
  const [otp, setOtp] = useState(Array(length).fill(''))
  const [activeIndex, setActiveIndex] = useState(0)
  const [timer, setTimer] = useState(resendTimer)
  const [canResend, setCanResend] = useState(false)
  const inputRefs = useRef([])

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true)
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [timer])

  const handleChange = useCallback((index, value) => {
    if (!/^\d*$/.test(value)) return

    const newOtp = [...otp]
    newOtp[index] = value.slice(-1)
    setOtp(newOtp)

    if (value && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
      setActiveIndex(index + 1)
    }

    if (newOtp.every((digit) => digit !== '')) {
      onComplete(newOtp.join(''))
    }
  }, [otp, length, onComplete])

  const handleKeyDown = useCallback((index, e) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        inputRefs.current[index - 1]?.focus()
        setActiveIndex(index - 1)
        const newOtp = [...otp]
        newOtp[index - 1] = ''
        setOtp(newOtp)
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus()
      setActiveIndex(index - 1)
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
      setActiveIndex(index + 1)
    }
  }, [otp, length])

  const handlePaste = useCallback((e) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
    if (pasted) {
      const newOtp = Array(length).fill('')
      pasted.split('').forEach((char, i) => {
        newOtp[i] = char
      })
      setOtp(newOtp)
      const focusIndex = Math.min(pasted.length, length - 1)
      inputRefs.current[focusIndex]?.focus()
      setActiveIndex(focusIndex)
      if (pasted.length === length) {
        onComplete(pasted)
      }
    }
  }, [length, onComplete])

  const handleResend = () => {
    if (canResend || timer === 0) {
      setTimer(resendTimer)
      setCanResend(false)
      onResend()
    }
  }

  return (
    <div className="flex flex-col items-center">
      <div className="flex gap-3 mb-6">
        {otp.map((digit, index) => (
          <input
            key={index}
            ref={(el) => (inputRefs.current[index] = el)}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            onFocus={() => setActiveIndex(index)}
            className={`w-12 h-14 text-center text-xl font-bold rounded-xl border-2 transition-all duration-200 outline-none ${
              digit
                ? 'border-primary-500 bg-primary-50 text-primary-700'
                : activeIndex === index
                ? 'border-primary-400 bg-white shadow-sm'
                : 'border-gray-200 bg-gray-50 hover:border-gray-300'
            }`}
          />
        ))}
      </div>

      <div className="text-center">
        {timer > 0 ? (
          <p className="text-sm text-gray-500">
            Resend code in <span className="font-medium text-primary-600">{timer}s</span>
          </p>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
          >
            Resend OTP
          </button>
        )}
      </div>
    </div>
  )
}
