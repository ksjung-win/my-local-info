import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "홈페이지 소개 | 성남시 생활 정보",
  description: "성남시 지역 주민을 위한 생활 정보 제공 웹사이트의 운영 목적과 데이터 출처를 안내합니다.",
};

export default function AboutPage() {
  return (
    <main className="main-content" style={{ marginTop: '40px', paddingBottom: '80px' }}>
      <article>
        <header style={{ marginBottom: '40px' }}>
          <h1 className="header-title" style={{ color: 'var(--text-main)', fontSize: '2.5rem', marginBottom: '16px', textShadow: 'none' }}>
            소개
          </h1>
        </header>
        
        <div className="prose prose-orange max-w-none">
          <h2>운영 목적</h2>
          <p>
            '성남시 생활 정보'는 지역 주민들에게 <strong>유익한 행사, 축제, 지원금, 혜택 정보</strong>를 한곳에서 빠르고 쉽게 제공하기 위해 만들어진 웹사이트입니다. 분산된 공공정보를 모아 누구나 접근하기 쉽게 전달하는 것을 목표로 합니다.
          </p>

          <h2>데이터 출처</h2>
          <p>
            본 사이트에서 제공되는 모든 정보의 원천 데이터는 신뢰할 수 있는 <a href="https://www.data.go.kr/" target="_blank" rel="noopener noreferrer">공공데이터포털(data.go.kr)</a>의 API를 통해 수집됩니다. 
          </p>

          <h2>콘텐츠 생성 방식</h2>
          <p>
            수집된 원본 데이터는 <strong>최신 AI 기술을 활용하여</strong> 읽기 쉽고 이해하기 편한 블로그 글 형태로 자동 가공 및 작성됩니다. 생성된 콘텐츠는 참고용이므로, 정확하고 구체적인 사항은 항상 각 글 하단에 첨부된 원문 출처 링크를 통해 확인해 주시기 바랍니다.
          </p>
        </div>
      </article>
    </main>
  );
}
