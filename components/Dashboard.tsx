"use client"

import { useState } from 'react';
import TimelineSlider from './Timeline/TimelineSlider';

export default function Dashboard() {
 

  return (
    <div className="min-h-screen text-white p-6 bg-black">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Dashboard Interface</h1>
        
        <TimelineSlider />
        
        {/* Dashboard Content */}

       
      </div>
    </div>
  );
}
