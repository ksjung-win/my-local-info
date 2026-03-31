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
      {/* 
        주의: data-ad-slot은 실제 AdSense 관리자 앱에서 생성한 슬롯 번호로 교체해야 합니다. 
        번호가 아직 없다면 렌더링되지 않도록 되어 있습니다.
      */}
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={adId}
        data-ad-slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT || ""} 
        data-ad-format="auto"
        data-full-width-responsive="true"
      ></ins>
    </div>
  );
}
