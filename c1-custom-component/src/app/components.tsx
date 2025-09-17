"use client";

import "@crayonai/react-ui/styles/index.css";
import { useOnAction, useC1State } from "@thesysai/genui-sdk";
import { useState } from "react";

// Reusable Tailwind class presets to keep JSX concise
const styles = {
  card: "rounded-2xl border border-white/10 bg-gradient-to-b from-neutral-900/80 to-black/60 text-neutral-100 shadow-xl",
  cardP5: "p-5",
  cardP6: "p-6",
  panel: "rounded-xl border border-white/10 bg-black/50 p-5",
  titleSm: "text-[1.1rem] font-semibold tracking-tight",
  h3: "mb-1 text-lg font-semibold tracking-tight text-neutral-100",
  subtext: "mb-4 text-sm text-neutral-400",
  btnBlack:
    "rounded-md border border-white/10 bg-black/70 px-4 py-2 font-semibold text-neutral-100 shadow-sm ring-1 ring-inset ring-white/5 transition hover:bg-black/80",
  btnBlackMd:
    "rounded-md border border-white/10 bg-black/70 px-4 py-2 font-medium text-neutral-100 shadow-sm ring-1 ring-inset ring-white/5 transition hover:bg-black/80 disabled:cursor-not-allowed disabled:opacity-50",
  input:
    "rounded-lg border border-white/10 bg-black/60 p-3 text-neutral-100 outline-none placeholder:text-neutral-500",
  muted: "text-neutral-400",
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

export const FlightCard = ({
  flight,
  onSelect,
}: {
  flight: Flight;
  onSelect: () => void;
}) => {
  if (!flight || !flight.flightNumber) return null;
  return (
    <div
      className={`group mb-3 flex w-full items-center justify-between ${styles.card} ${styles.cardP5} transition-colors hover:border-white/15 hover:from-neutral-900/90 hover:to-black/80`}
    >
      <div>
        <div className="flex items-center gap-3">
          <span className="text-2xl">✈️</span>
          <div>
            <h4 className={`m-0 ${styles.titleSm}`}>
              {flight.airline} {flight.flightNumber}
            </h4>
            <p className={`m-0 ${styles.muted}`}>
              {flight.departure} → {flight.arrival}
            </p>
          </div>
        </div>
        <div className={`mt-3 text-sm ${styles.muted}`}>
          <span>
            {flight.departureTime} - {flight.arrivalTime} ({flight.duration})
          </span>
          {flight.stops > 0 && (
            <span className="ml-3">{flight.stops} stop</span>
          )}
        </div>
      </div>
      <div className="text-right">
        <p className="m-0 text-2xl font-extrabold text-neutral-100">
          ${flight.price}
        </p>
        <button onClick={onSelect} className={`mt-2 ${styles.btnBlack}`}>
          Select
        </button>
      </div>
    </div>
  );
};

export const FlightList = ({ flights }: { flights: Flight[] }) => {
  const onAction = useOnAction();
  return (
    <div className="w-full">
      <h3 className="mb-4 text-[1.5rem] font-semibold text-neutral-100">
        Available Flights
      </h3>
      {flights &&
        flights.map((flight) => (
          <FlightCard
            key={flight.flightNumber}
            flight={flight}
            onSelect={() =>
              onAction(
                "Select Flight",
                `User selected flight ${flight.flightNumber}`,
              )
            }
          />
        ))}
    </div>
  );
};

const Seat = ({
  number,
  status,
  onClick,
}: {
  number: string;
  status: "available" | "occupied" | "selected";
  onClick: () => void;
}) => {
  const getSeatStyle = () => {
    const baseStyle =
      "flex h-10 w-10 items-center justify-center rounded-lg border font-semibold transition ";
    if (status === "occupied") {
      return (
        baseStyle +
        " cursor-not-allowed border-slate-700 bg-slate-800/70 text-slate-500"
      );
    }
    if (status === "selected") {
      return (
        baseStyle +
        " cursor-pointer border-slate-300 bg-slate-200 text-slate-900 shadow"
      );
    }
    return (
      baseStyle +
      " cursor-pointer border-slate-700 border-slate-700/60 bg-gradient-to-b from-neutral-900/80 to-black/60 text-slate-200 hover:border-slate-500"
    );
  };
  return (
    <div
      className={getSeatStyle()}
      onClick={status !== "occupied" ? onClick : undefined}
    >
      {number}
    </div>
  );
};

export const SeatSelector = ({
  price,
  seatPrice,
}: {
  price: number;
  seatPrice: number;
}) => {
  const onAction = useOnAction();
  const { getValue, setValue } = useC1State("selectedSeats");
  const selectedSeats: string[] = getValue() || [];
  const toggleSeat = (seatNumber: string) => {
    const newSelectedSeats = selectedSeats.includes(seatNumber)
      ? selectedSeats.filter((s) => s !== seatNumber)
      : [...selectedSeats, seatNumber];
    setValue(newSelectedSeats);
  };

  const seats = [
    ["1A", "1B", null, "1C", "1D"],
    ["2A", "2B", null, "2C", "2D"],
    ["3A", "3B", null, "3C", "3D"],
    ["4A", "4B", null, "4C", "4D"],
  ];
  const occupiedSeats = ["2C", "3D"];

  const totalPrice = price + selectedSeats.length * seatPrice;

  return (
    <div className={`mx-auto max-w-[640px] ${styles.card} ${styles.cardP6}`}>
      <h3 className="mb-4 text-lg font-semibold tracking-tight">
        Select Your Seats
      </h3>
      <div className={`mb-4 ${styles.panel}`}>
        {seats.map((row, rowIndex) => (
          <div key={rowIndex} className="mb-2 flex justify-center gap-2">
            {row.map((seat, seatIndex) =>
              seat ? (
                <Seat
                  key={seat}
                  number={seat}
                  status={
                    occupiedSeats.includes(seat)
                      ? "occupied"
                      : selectedSeats.includes(seat)
                        ? "selected"
                        : "available"
                  }
                  onClick={() => toggleSeat(seat)}
                />
              ) : (
                <div key={seatIndex} className="w-10" />
              ),
            )}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between">
        <div>
          <p className="m-0 text-xl font-semibold">
            Total: ${totalPrice.toFixed(2)}
          </p>
          <p className="m-0 text-sm text-neutral-400">
            {selectedSeats.length} seat(s) selected
          </p>
        </div>
        <button
          onClick={() =>
            onAction(
              "Confirm Seats",
              `User confirmed ${selectedSeats.length} seat(s): ${selectedSeats.join(", ")}. The total price is ${totalPrice}`,
            )
          }
          className={styles.btnBlackMd}
          disabled={selectedSeats.length === 0}
        >
          Confirm Seats
        </button>
      </div>
    </div>
  );
};

export const BookingSummary = ({
  flight,
  seats,
  passengers,
  price,
}: {
  flight: any;
  seats: string[];
  passengers: {
    name: string;
    gender: string;
    dateOfBirth: string;
    seat: string;
  }[];
  price: number;
}) => {
  const onAction = useOnAction();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const PaymentModal = () => (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        className={`max-w-[480px] ${styles.card} ${styles.cardP6} shadow-2xl`}
      >
        <h3 className="mb-5 text-lg font-semibold tracking-tight">
          Secure Payment
        </h3>
        <div className="flex flex-col gap-3">
          <input placeholder="Card Number" className={styles.input} />
          <div className="flex gap-3">
            <input placeholder="MM / YY" className={`flex-1 ${styles.input}`} />
            <input placeholder="CVC" className={`flex-1 ${styles.input}`} />
          </div>
          <input placeholder="Name on Card" className={styles.input} />
        </div>
        <div className="mt-5 flex justify-end gap-3">
          <button
            onClick={() => setIsModalOpen(false)}
            className="rounded-md border border-white/10 bg-transparent px-4 py-2 text-neutral-100"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onAction("Pay Now", "User submitted payment");
              setIsModalOpen(false);
            }}
            className="rounded-md bg-neutral-200 px-4 py-2 font-semibold text-neutral-900 shadow-sm ring-1 ring-inset ring-white/5 transition hover:bg-neutral-300"
          >
            Pay ${price.toFixed(2)}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className={`max-w-[720px] ${styles.card} ${styles.cardP6}`}>
        <h3 className={styles.h3}>Booking Summary</h3>
        <p className={styles.subtext}>
          Review your flight details before payment
        </p>
        <div className="border-t border-white/10 pt-4">
          <p>
            <strong>Flight:</strong> {flight.airline} {flight.flightNumber}
          </p>
          <p>
            <strong>Route:</strong> {flight.departure} to {flight.arrival}
          </p>
          <p>
            <strong>Seats:</strong> {seats.join(", ")}
          </p>
          <p>
            <strong>Passengers:</strong>
          </p>
          <ul className="list-inside list-disc text-neutral-300">
            {passengers.map((p) => (
              <li key={p.name}>
                <span className="text-neutral-100">{p?.name}</span> ({p?.gender}
                ) {p?.dateOfBirth} {p?.seat}
              </li>
            ))}
          </ul>
          <h4 className="mt-5 text-right text-2xl font-semibold">
            Total: ${price.toFixed(2)}
          </h4>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className={`mt-5 w-full ${styles.btnBlack}`}
        >
          Proceed to Payment
        </button>
      </div>
      {isModalOpen && <PaymentModal />}
    </>
  );
};
