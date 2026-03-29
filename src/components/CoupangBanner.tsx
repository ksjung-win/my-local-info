import React from 'react';

export default function CoupangBanner() {
  const partnerId = process.env.NEXT_PUBLIC_COUPANG_PARTNER_ID;

  if (!partnerId || partnerId === '나중에_입력') {
    return null;
  }

  return (
    <div style={{ margin: '30px 0', textAlign: 'center' }}>
      <p style={{ fontSize: '0.8rem', color: '#9ca3af', marginBottom: '8px' }}>
        이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.
      </p>
      {/* 
        참고: 발급받은 쿠팡 파트너스 배너 스크립트나 iframe 코드로 교체하세요. 
        아래는 기본 예시 코드입니다.
      */}
      <iframe 
        src={`https://ads-partners.coupang.com/widgets.html?id=${partnerId}&template=carousel&trackingCode=${partnerId}&subId=&width=680&height=140`}
        width="100%" 
        height="140" 
        frameBorder="0" 
        scrolling="no" 
        referrerPolicy="unsafe-url"
        style={{ maxWidth: '680px' }}
      ></iframe>
    </div>
  );
}
