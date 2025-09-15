"use client";

import "@crayonai/react-ui/styles/index.css";
import {
  C1Chat,
  useThreadListManager,
  useThreadManager,
  useOnAction,
  useC1State
} from "@thesysai/genui-sdk";
import * as apiClient from "@/src/apiClient";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";


const colors = {
  primary: '#e2e8f0', 
  primaryDark: '#a0aec0',
  background: '#1a202c',
  surface: '#2d3748',
  text: '#e2e8f0',
  textSecondary: '#a0aec0',
  border: '#4a5568',
  success: '#2d3748',
  white: '#ffffff',
  black: '#1a202c',
};

const styles = {
  card: {
    backgroundColor: colors.surface,
    color: colors.text,
    padding: '24px',
    borderRadius: '12px',
    margin: '16px 0',
    fontFamily: 'sans-serif',
    border: `1px solid ${colors.border}`,
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
  },
  button: {
    backgroundColor: colors.primary,
    color: colors.black,
    border: 'none',
    borderRadius: '8px',
    padding: '12px 24px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '600',
    transition: 'background-color 0.2s',
  },
};

interface Flight {
  flightNumber: string;
  airline: string;
  departure: string;
  arrival: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  price: number;
  stops: number;
}

const FlightCard = ({ flight, onSelect }: { flight: Flight; onSelect: () => void }) => {
  if (!flight || !flight.flightNumber) return null;
  return ( <div style={{...styles.card, padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px'}}>
    <div>
      <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
        <span style={{fontSize: '1.5rem'}}>✈️</span>
        <div>
          <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600' }}>{flight.airline} {flight.flightNumber}</h4>
          <p style={{ margin: 0, color: colors.textSecondary }}>{flight.departure} → {flight.arrival}</p>
        </div>
      </div>
      <div style={{ marginTop: '12px', color: colors.textSecondary, fontSize: '0.9rem' }}>
        <span>{flight.departureTime} - {flight.arrivalTime} ({flight.duration})</span>
        {flight.stops > 0 && <span style={{ marginLeft: '12px' }}>{flight.stops} stop</span>}
      </div>
    </div>
    <div style={{textAlign: 'right'}}>
      <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color: colors.text }}>${flight.price}</p>
      <button onClick={onSelect} style={{...styles.button, padding: '8px 16px', marginTop: '8px'}}>Select</button>
    </div>
  </div>);
};

const FlightList = ({ flights }: { flights: Flight[] }) => {
  const onAction = useOnAction();
  return (
    <div style={{maxWidth: '700px'}}>
      <h3 style={{color: colors.text, fontSize: '1.5rem', marginBottom: '16px'}}>Available Flights</h3>
      {flights && flights.map((flight) => (
        <FlightCard key={flight.flightNumber} flight={flight} onSelect={() => onAction('Select Flight', `User selected flight ${flight.flightNumber}`)} />
      ))}
    </div>
  );
};

const Seat = ({ number, status, onClick }: { number: string, status: 'available' | 'occupied' | 'selected', onClick: () => void }) => {
  const getSeatStyle = () => {
    const baseStyle = {
      width: '40px',
      height: '40px',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: '600',
      cursor: status === 'occupied' ? 'not-allowed' : 'pointer',
      border: `1px solid ${colors.border}`,
    };
    if (status === 'occupied') {
      return { ...baseStyle, backgroundColor: colors.border, color: colors.textSecondary };
    }
    if (status === 'selected') {
      return { ...baseStyle, backgroundColor: colors.primary, color: colors.black };
    }
    return { ...baseStyle, backgroundColor: colors.surface };
  };
  return <div style={getSeatStyle()} onClick={status !== 'occupied' ? onClick : undefined}>{number}</div>;
};

const SeatSelector = ({ price, seatPrice }: { price: number, seatPrice: number }) => {
  const onAction = useOnAction();
  const { getValue, setValue } = useC1State('selectedSeats');
  const selectedSeats: string[] = getValue() || [];
  const toggleSeat = (seatNumber: string) => {
    const newSelectedSeats = selectedSeats.includes(seatNumber) 
      ? selectedSeats.filter(s => s !== seatNumber) 
      : [...selectedSeats, seatNumber];
    setValue(newSelectedSeats);
  };

  const seats = [
    ['1A', '1B', null, '1C', '1D'],
    ['2A', '2B', null, '2C', '2D'],
    ['3A', '3B', null, '3C', '3D'],
    ['4A', '4B', null, '4C', '4D'],
  ];
  const occupiedSeats = ['2C', '3D'];

  const totalPrice = price + (selectedSeats.length * seatPrice);

  return (
    <div style={{...styles.card, maxWidth: '500px'}}>
      <h3 style={{ margin: '0 0 16px 0' }}>Select Your Seats</h3>
      <div style={{backgroundColor: '#1a202c', padding: '16px', borderRadius: '8px', marginBottom: '16px'}}>
        {seats.map((row, rowIndex) => (
          <div key={rowIndex} style={{display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '8px'}}>
            {row.map((seat, seatIndex) =>
              seat ? (
                <Seat 
                  key={seat} 
                  number={seat}
                  status={occupiedSeats.includes(seat) ? 'occupied' : selectedSeats.includes(seat) ? 'selected' : 'available'} 
                  onClick={() => toggleSeat(seat)}
                />
              ) : (
                <div key={seatIndex} style={{width: '40px'}} />
              )
            )}
          </div>
        ))}
      </div>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <div>
          <p style={{ margin: 0, fontSize: '1.2rem', fontWeight: 'bold' }}>Total: ${totalPrice.toFixed(2)}</p>
          <p style={{ margin: 0, color: colors.textSecondary }}>{selectedSeats.length} seat(s) selected</p>
        </div>
        <button 
          onClick={() => onAction('Confirm Seats', `User confirmed ${selectedSeats.length} seat(s): ${selectedSeats.join(', ')}. The total price is ${totalPrice}`)} 
          style={styles.button}
          disabled={selectedSeats.length === 0}
        >
          Confirm Seats
        </button>
      </div>
    </div>
  );
};

const BookingSummary = ({ flight, seats, passengers, price }: { flight: any, seats: string[], passengers: { name: string, gender: string, dateOfBirth: string, seat: string }[], price: number }) => {
  const onAction = useOnAction();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const PaymentModal = () => (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
      <div style={{...styles.card, maxWidth: '450px'}}>
        <h3 style={{ margin: '0 0 20px 0' }}>Secure Payment</h3>
        <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
          <input placeholder="Card Number" style={{padding: '12px', borderRadius: '8px', border: `1px solid ${colors.border}`, background: colors.background, color: colors.text}} />
          <div style={{display: 'flex', gap: '12px'}}>
            <input placeholder="MM / YY" style={{flex: 1, padding: '12px', borderRadius: '8px', border: `1px solid ${colors.border}`, background: colors.background, color: colors.text}} />
            <input placeholder="CVC" style={{flex: 1, padding: '12px', borderRadius: '8px', border: `1px solid ${colors.border}`, background: colors.background, color: colors.text}} />
          </div>
          <input placeholder="Name on Card" style={{padding: '12px', borderRadius: '8px', border: `1px solid ${colors.border}`, background: colors.background, color: colors.text}} />
        </div>
        <div style={{display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px'}}>
           <button onClick={() => setIsModalOpen(false)} style={{...styles.button, backgroundColor: 'transparent', color: colors.text, border: `1px solid ${colors.border}`}}>Cancel</button>
           <button onClick={() => { onAction('Pay Now', 'User submitted payment'); setIsModalOpen(false); }} style={{...styles.button}}>Pay ${price.toFixed(2)}</button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div style={{...styles.card, maxWidth: '600px'}}>
        <h3 style={{ margin: '0 0 16px 0', color: colors.text }}>Booking Summary</h3>
        <div style={{borderTop: `1px solid ${colors.border}`, paddingTop: '16px'}}>
          <p><strong>Flight:</strong> {flight.airline} {flight.flightNumber}</p>
          <p><strong>Route:</strong> {flight.departure} to {flight.arrival}</p>
          <p><strong>Seats:</strong> {seats.join(', ')}</p>
          <p><strong>Passengers:</strong></p>
          <ul>
            {passengers.map((p) => <li key={p.name}>{p?.name} ({p?.gender}) {p?.dateOfBirth} {p?.seat}</li>)}
          </ul>
          <h4 style={{textAlign: 'right', fontSize: '1.5rem', marginTop: '20px'}}>Total: ${price.toFixed(2)}</h4>
        </div>
        <button onClick={() => setIsModalOpen(true)} style={{...styles.button, width: '100%', marginTop: '20px'}}>Proceed to Payment</button>
      </div>
      {isModalOpen && <PaymentModal />}
    </>
  );
};

const BookingConfirmation = ({ bookingNumber, flight }: { bookingNumber: string, flight: any }) => (
  <div style={{...styles.card, maxWidth: '550px', textAlign: 'center'}}>
    <h2 style={{color: colors.text, margin: '0 0 12px 0'}}>✅ Booking Confirmed!</h2>
    <p style={{color: colors.textSecondary, margin: 0}}>Your flight is booked. Your confirmation number is:</p>
    <p style={{fontSize: '2rem', fontWeight: 'bold', color: colors.text, margin: '12px 0', background: 'rgba(0,0,0,0.1)', padding: '8px', borderRadius: '8px'}}>{bookingNumber}</p>
    <p style={{color: colors.textSecondary, margin: 0}}>{flight.airline} {flight.flightNumber} from {flight.departure} to {flight.arrival}</p>
  </div>
);


export default function Home() {
  const searchParams = useSearchParams();
  const threadIdInUrl = searchParams.get("threadId");
  const pathname = usePathname();
  const { replace } = useRouter();

  const threadListManager = useThreadListManager({
    fetchThreadList: () => apiClient.getThreadList(),
    deleteThread: (threadId) => apiClient.deleteThread(threadId),
    updateThread: (t) => apiClient.updateThread(t),
    onSwitchToNew: () => {
      replace(`${pathname}`);
    },
    onSelectThread: (threadId) => {
      const newSearch = `?threadId=${threadId}`;
      replace(`${pathname}${newSearch}`);
    },
    createThread: (message) => {
      return apiClient.createThread(message.message!);
    },
  });

  const threadManager = useThreadManager({
    threadListManager,
    loadThread: (threadId) => apiClient.getMessages(threadId),
    onUpdateMessage: ({ message }) => {
      apiClient.updateMessage(threadListManager.selectedThreadId!, message);
    },
    apiUrl: "/api/chat",
    customizeC1: {
      customComponents: {
        FlightList,
        SeatSelector,
        BookingSummary,
        BookingConfirmation,
      },
    },
  });

  useEffect(() => {
    // at the first render, if there is a threadId in the url, select the thread
    if (threadIdInUrl && threadListManager.selectedThreadId !== threadIdInUrl) {
      threadListManager.selectThread(threadIdInUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <C1Chat
      threadManager={threadManager}
      threadListManager={threadListManager}
    />
  );
}
