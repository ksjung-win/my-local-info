'use client';

import { useEffect } from 'react';

export default function AdBanner() {
  const adId = process.env.NEXT_PUBLIC_ADSENSE_ID;
  if (!adId || adId === "나중에_입력") return null;

  useEffect(() => {
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.error('AdSense error:', err);
    }
  }, []);

  return (
    <div style={{ margin: '30px 0', textAlign: 'center', overflow: 'hidden', minHeight: '100px' }}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={adId}
        data-ad-slot="YOUR_AD_SLOT" 
        data-ad-format="auto"
        data-full-width-responsive="true"
      ></ins>
    </div>
  );
}
