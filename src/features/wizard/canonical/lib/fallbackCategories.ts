/**
 * Hardcoded category fallback — Plan C for Step 1.
 * Only rendered when the database is unreachable.
 * Sourced from the live DB on 2026-04-08.
 */

export interface FallbackCategory {
  id: string;
  name: string;
}

export const FALLBACK_CATEGORIES: FallbackCategory[] = [
  { id: '28c4bf36-bd2a-4893-9c0c-359311776023', name: 'Construction' },
  { id: '431addb4-23ae-44aa-9e8d-a9e3c58faedb', name: 'Carpentry' },
  { id: '5cd3d75e-4e46-420e-b19d-cc55545e071f', name: 'Electrical' },
  { id: 'd47a4325-21eb-480e-b990-39e585185cc5', name: 'Plumbing' },
  { id: '61d8fc25-954f-419a-830d-fa393657a368', name: 'HVAC' },
  { id: '9397007d-2bd7-4fe9-b2b7-44f0cab9eb05', name: 'Painting & Decorating' },
  { id: 'e2e4d1d4-ffbc-45fd-8f28-e6857e9a0f06', name: 'Cleaning' },
  { id: 'e3bb5786-3205-437f-8e60-3a330a8aa701', name: 'Gardening & Landscaping' },
  { id: '9edceedc-a66e-4cbc-a82e-2fa01793af76', name: 'Pool & Spa' },
  { id: '1216a3a6-cc19-4837-bbad-35c737d127ec', name: 'Architects, Design & Management' },
  { id: '961ee3f1-d4a6-45d9-8470-7a0ec00a25df', name: 'Transport & Logistics' },
  { id: 'c2cd5c8c-b1a5-4997-a359-a07e6c422525', name: 'Kitchen & Bathroom' },
  { id: 'e5c46792-eaa2-4b30-80ca-5671377b11d9', name: 'Floors, Doors & Windows' },
  { id: '1f9b6d83-9721-4e87-b761-e1e528a0a194', name: 'Handyman & General' },
  { id: '6eed92ab-c4b6-4044-ba6a-2c14cb07c7c9', name: 'Commercial & Industrial' },
  { id: '4c3caf15-b5ea-4842-a2fa-7fd8b391d8ee', name: 'Legal & Regulatory' },
];
