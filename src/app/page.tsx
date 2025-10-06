import type { Metadata } from "next";
import Scheduler from '@/components/Scheduler';

export const metadata: Metadata = {
  title: "Scheduling System - Book Your Appointment",
  description: "A simple POC scheduling system for booking appointments between 7 AM and 7 PM",
};

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Scheduler />
    </div>
  );
}
