'use client';

import { useState, useEffect } from 'react';
import { 
  getAppointments, 
  createAppointment, 
  deleteAppointment, 
  generateTimeSlots, 
  formatTime, 
  isPastSlot, 
  canCancelAppointment,
  type Appointment 
} from '@/lib/api';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSlot: string;
  onBookingSuccess: () => void;
}

interface CancellationModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment;
  onCancellationSuccess: () => void;
}

function BookingModal({ isOpen, onClose, selectedSlot, onBookingSuccess }: BookingModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }
    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await createAppointment({
        name: name.trim(),
        email: email.trim(),
        start: selectedSlot,
      });
      
      setName('');
      setEmail('');
      onBookingSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to book appointment');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Book Appointment</h3>
                <p className="text-sm text-gray-500">{formatTime(selectedSlot)}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isLoading}
              className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Your Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your full name"
              required
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your email address"
              required
            />
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}
          
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Booking...
                </div>
              ) : (
                'Book Appointment'
              )}
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
}

function CancellationModal({ isOpen, onClose, appointment, onCancellationSuccess }: CancellationModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCancel = async () => {
    setIsLoading(true);
    setError('');

    try {
      await deleteAppointment(appointment.id);
      onCancellationSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel appointment');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm mx-auto">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Cancel Appointment</h3>
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">
              <strong>{appointment.name}</strong> - {formatTime(appointment.start)}
            </p>
            <p className="text-xs text-gray-500">
              This action cannot be undone.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              Keep
            </button>
            <button
              onClick={handleCancel}
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {isLoading ? 'Cancelling...' : 'Cancel'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface TimeSlotProps {
  slot: string;
  appointment?: Appointment;
  isBooked: boolean;
  onBook: (slot: string) => void;
  onCancel: (appointmentId: string) => void;
}

function TimeSlot({ slot, appointment, isBooked, onBook, onCancel }: TimeSlotProps) {
  const isPast = isPastSlot(slot);
  const canCancel = appointment ? canCancelAppointment(appointment.start) : false;

  const handleClick = () => {
    if (isPast) return;
    
    if (isBooked && canCancel) {
      onCancel(appointment!.id);
    } else if (!isBooked) {
      onBook(slot);
    }
  };

  const getSlotClasses = () => {
    let baseClasses = "p-4 border rounded-lg text-center cursor-pointer transition-colors min-h-[80px] flex flex-col justify-center";
    
    if (isPast) {
      return `${baseClasses} bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed`;
    }
    
    if (isBooked) {
      // Booked slot - can cancel if within time limit
      return canCancel 
        ? `${baseClasses} bg-red-100 border-red-300 text-red-700 hover:bg-red-200`
        : `${baseClasses} bg-red-100 border-red-300 text-red-700 cursor-not-allowed`;
    }
    
    // Available slot
    return `${baseClasses} bg-green-100 border-green-300 text-green-700 hover:bg-green-200`;
  };

  const getSlotText = () => {
    if (isBooked) {
      return canCancel ? `cancel: ${appointment?.name}` : `Booked: ${appointment?.name}`;
    }
    return '';
  };

  const getTooltipText = () => {
    if (isBooked) {
      return `Booked by ${appointment?.name} (${appointment?.email})`;
    }
    return 'Click to book';
  };

  return (
    <div 
      className={getSlotClasses()}
      onClick={handleClick}
      title={getTooltipText()}
    >
      <div className="font-medium text-base">{formatTime(slot)}</div>
      {getSlotText() && (
        <div className="text-sm mt-1">{getSlotText()}</div>
      )}
    </div>
  );
}

export default function Scheduler() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [bookingModal, setBookingModal] = useState<{
    isOpen: boolean;
    selectedSlot: string;
  }>({ isOpen: false, selectedSlot: '' });
  const [cancellationModal, setCancellationModal] = useState<{
    isOpen: boolean;
    appointment: Appointment | null;
  }>({ isOpen: false, appointment: null });

  const dateStr = selectedDate.toISOString().split('T')[0];
  const timeSlots = generateTimeSlots(selectedDate);

  const loadAppointments = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const data = await getAppointments(dateStr);
      setAppointments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load appointments');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, [dateStr]);

  const handleBookSlot = (slot: string) => {
    setBookingModal({ isOpen: true, selectedSlot: slot });
  };

  const handleCancelAppointment = (appointmentId: string) => {
    const appointment = appointments.find(apt => apt.id === appointmentId);
    if (appointment) {
      setCancellationModal({ isOpen: true, appointment });
    }
  };

  const handleCancellationSuccess = () => {
    loadAppointments();
  };

  const handleBookingSuccess = () => {
    loadAppointments();
  };

  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const getAppointmentForSlot = (slot: string) => {
    return appointments.find(apt => apt.start === slot);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Scheduling System</h1>
        <p className="text-gray-600">Select a date and choose an available time slot to book your appointment.</p>
      </div>

      <div className="mb-6">
        <label htmlFor="date-picker" className="block text-sm font-medium text-gray-700 mb-2">
          Select Date
        </label>
        <input
          type="date"
          id="date-picker"
          value={formatDateForInput(selectedDate)}
          onChange={(e) => setSelectedDate(new Date(e.target.value))}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading appointments...</p>
        </div>
      ) : (
        <>
          <div className="mb-6 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-lg font-medium text-gray-900">
                  {selectedDate.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </span>
              </div>
              <div className="text-sm text-gray-600">
                Operating Hours: 7:00 AM - 7:00 PM
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {timeSlots.map((slot) => {
              const appointment = getAppointmentForSlot(slot);
              const isBooked = !!appointment;
              
              return (
                <TimeSlot
                  key={slot}
                  slot={slot}
                  appointment={appointment}
                  isBooked={isBooked}
                  onBook={handleBookSlot}
                  onCancel={handleCancelAppointment}
                />
              );
            })}
          </div>

          <div className="mt-6 flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
              <span>Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
              <span>Booked</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded"></div>
              <span>Past/Invalid</span>
            </div>
          </div>
        </>
      )}

      <BookingModal
        isOpen={bookingModal.isOpen}
        onClose={() => setBookingModal({ isOpen: false, selectedSlot: '' })}
        selectedSlot={bookingModal.selectedSlot}
        onBookingSuccess={handleBookingSuccess}
      />

      {cancellationModal.appointment && (
        <CancellationModal
          isOpen={cancellationModal.isOpen}
          onClose={() => setCancellationModal({ isOpen: false, appointment: null })}
          appointment={cancellationModal.appointment}
          onCancellationSuccess={handleCancellationSuccess}
        />
      )}
    </div>
  );
}
