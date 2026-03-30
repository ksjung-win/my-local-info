import React from 'react';

export default function CoupangBanner() {
  return (
    <div style={{ textAlign: 'left' }}>
      <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '12px' }}>
        이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.
      </p>
      <div style={{ textAlign: 'center' }}>
        <iframe 
          src="https://ads-partners.coupang.com/widgets.html?id=976291&template=carousel&trackingCode=AF1793092&subId=&width=680&height=140"
          width="100%" 
          height="140" 
          frameBorder="0" 
          scrolling="no" 
          referrerPolicy="unsafe-url"
          style={{ maxWidth: '680px', border: '1px solid #eee', borderRadius: '8px', backgroundColor: '#fff' }}
        ></iframe>
      </div>
    </div>
  );
}
