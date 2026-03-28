import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl p-8 md:p-16 shadow-xl shadow-slate-200/50 border border-slate-100">
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">
            이용약관
          </h1>
          <p className="text-sm text-slate-500 mb-12">
            시행일자: 2026년 3월 28일
          </p>

          {/* 제1조 */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-slate-900 mb-4 border-l-4 border-black pl-4">
              제1조 (목적)
            </h2>
            <p className="text-base text-slate-600 leading-relaxed">
              본 약관은 주식회사 디어스(이하 &ldquo;회사&rdquo;)가 운영하는 제평가는요 웹사이트(이하 &ldquo;사이트&rdquo;)에서 제공하는 프로젝트 평가 플랫폼 서비스(이하 &ldquo;서비스&rdquo;)를 이용함에 있어 회사와 이용자의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
            </p>
          </section>

          {/* 제2조 */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-slate-900 mb-4 border-l-4 border-black pl-4">
              제2조 (정의)
            </h2>
            <div className="space-y-3 text-base text-slate-600 leading-relaxed">
              <p>본 약관에서 사용하는 용어의 정의는 다음과 같습니다.</p>
              <ul className="list-decimal list-inside space-y-2 ml-4">
                <li>&ldquo;서비스&rdquo;라 함은 회사가 제공하는 프로젝트 등록, 평가, 협업 매칭 등 제반 서비스를 의미합니다.</li>
                <li>&ldquo;이용자&rdquo;라 함은 사이트에 접속하여 본 약관에 따라 회사가 제공하는 서비스를 이용하는 고객을 말합니다.</li>
                <li>&ldquo;프로젝트&rdquo;라 함은 이용자가 평가를 위해 등록하는 창작물·서비스·제품 등을 의미합니다.</li>
                <li>&ldquo;개인정보&rdquo;라 함은 생존하는 개인에 관한 정보로서 성명, 연락처 등 개인을 식별할 수 있는 정보를 말합니다.</li>
              </ul>
            </div>
          </section>

          {/* 제3조 */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-slate-900 mb-4 border-l-4 border-black pl-4">
              제3조 (약관의 게시와 개정)
            </h2>
            <div className="space-y-3 text-base text-slate-600 leading-relaxed">
              <p>① 회사는 본 약관의 내용을 이용자가 쉽게 알 수 있도록 사이트 내에 게시합니다.</p>
              <p>② 회사는 필요한 경우 관련 법령을 위배하지 않는 범위에서 본 약관을 개정할 수 있습니다.</p>
              <p>③ 회사가 약관을 개정할 경우에는 적용일자 및 개정사유를 명시하여 현행약관과 함께 사이트에 그 적용일자 7일 전부터 적용일자 전일까지 공지합니다.</p>
              <p>④ 이용자가 개정약관의 적용에 동의하지 않는 경우 회사는 개정 약관의 내용을 적용할 수 없으며, 이 경우 이용자는 서비스 이용을 중단할 수 있습니다.</p>
            </div>
          </section>

          {/* 제4조 */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-slate-900 mb-4 border-l-4 border-black pl-4">
              제4조 (서비스의 제공 및 변경)
            </h2>
            <div className="space-y-3 text-base text-slate-600 leading-relaxed">
              <p>① 회사는 다음과 같은 서비스를 제공합니다.</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>프로젝트 등록 및 관리 서비스</li>
                <li>전문가 평가 서비스</li>
                <li>협업 매칭 및 제안 서비스</li>
                <li>기타 회사가 추가 개발하거나 제휴를 통해 제공하는 서비스</li>
              </ul>
              <p>② 회사는 상당한 이유가 있는 경우에 운영상, 기술상의 필요에 따라 제공하고 있는 서비스를 변경할 수 있습니다.</p>
            </div>
          </section>

          {/* 제5조 */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-slate-900 mb-4 border-l-4 border-black pl-4">
              제5조 (서비스의 중단)
            </h2>
            <div className="space-y-3 text-base text-slate-600 leading-relaxed">
              <p>① 회사는 컴퓨터 등 정보통신설비의 보수점검, 교체 및 고장, 통신의 두절 등의 사유가 발생한 경우에는 서비스의 제공을 일시적으로 중단할 수 있습니다.</p>
              <p>② 제1항의 사유로 서비스 제공이 일시 중단됨으로 인하여 이용자 또는 제3자가 입은 손해에 대하여는 배상하지 아니합니다. 다만, 회사에 고의 또는 중과실이 있는 경우에는 그러하지 아니합니다.</p>
            </div>
          </section>

          {/* 제6조 */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-slate-900 mb-4 border-l-4 border-black pl-4">
              제6조 (이용자의 의무)
            </h2>
            <div className="space-y-3 text-base text-slate-600 leading-relaxed">
              <p>① 이용자는 다음 행위를 하여서는 안 됩니다.</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>신청 또는 변경 시 허위 내용의 등록</li>
                <li>타인의 정보 도용</li>
                <li>회사가 게시한 정보의 변경</li>
                <li>회사와 기타 제3자의 저작권 등 지적재산권에 대한 침해</li>
                <li>허위 또는 악의적인 평가 작성</li>
                <li>회사 및 기타 제3자의 명예를 손상시키거나 업무를 방해하는 행위</li>
              </ul>
            </div>
          </section>

          {/* 제7조 */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-slate-900 mb-4 border-l-4 border-black pl-4">
              제7조 (저작권의 귀속 및 이용제한)
            </h2>
            <div className="space-y-3 text-base text-slate-600 leading-relaxed">
              <p>① 회사가 작성한 저작물에 대한 저작권 기타 지적재산권은 회사에 귀속합니다.</p>
              <p>② 이용자가 등록한 프로젝트의 저작권은 이용자에게 있으며, 회사는 평가 서비스 제공 목적으로만 사용합니다.</p>
            </div>
          </section>

          {/* 제8조 */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-slate-900 mb-4 border-l-4 border-black pl-4">
              제8조 (분쟁해결)
            </h2>
            <div className="space-y-3 text-base text-slate-600 leading-relaxed">
              <p>① 회사는 이용자가 제기하는 정당한 의견이나 불만을 반영하고 그 피해를 보상처리하기 위하여 피해보상처리기구를 설치·운영합니다.</p>
              <p>② 회사는 이용자로부터 제출되는 불만사항 및 의견은 우선적으로 그 사항을 처리합니다.</p>
            </div>
          </section>

          {/* 제9조 */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-slate-900 mb-4 border-l-4 border-black pl-4">
              제9조 (재판권 및 준거법)
            </h2>
            <div className="space-y-3 text-base text-slate-600 leading-relaxed">
              <p>① 회사와 이용자 간에 발생한 서비스 이용에 관한 분쟁에 대하여는 대한민국 법을 적용합니다.</p>
              <p>② 회사와 이용자 간에 발생한 분쟁에 관한 소송은 민사소송법상의 관할법원에 제기합니다.</p>
            </div>
          </section>

          {/* 부칙 */}
          <section className="mb-10 pt-8 border-t border-slate-200">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              부칙
            </h2>
            <p className="text-base text-slate-600 leading-relaxed">
              본 약관은 2026년 3월 28일부터 시행됩니다.
            </p>
          </section>

          {/* 문의 안내 */}
          <div className="mt-12 p-6 bg-slate-50 rounded-2xl border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 mb-3">
              이용약관 관련 문의
            </h3>
            <div className="text-sm text-slate-500 space-y-1">
              <p>이메일: support@myratingis.kr</p>
              <p>사업자: 주식회사 디어스 (대표 이준호, 사업자등록번호 449-81-02594)</p>
            </div>
          </div>

          <div className="mt-8 text-center">
            <Link href="/" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">
              ← 홈으로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
