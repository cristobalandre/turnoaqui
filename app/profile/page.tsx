import React from 'react';
import ArtistProfile from '@/components/studio/ArtistProfile'; // Importamos tu componente

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8">
      <ArtistProfile />
    </div>
  );
}