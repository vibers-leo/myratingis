import Link from "next/link";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl p-8 md:p-16 shadow-xl shadow-slate-200/50 border border-slate-100">
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">
            개인정보처리방침
          </h1>
          <p className="text-sm text-slate-500 mb-12">
            시행일자: 2026년 3월 28일
          </p>

          {/* 전문 */}
          <section className="mb-10">
            <p className="text-base text-slate-600 leading-relaxed">
              주식회사 디어스(이하 &ldquo;회사&rdquo;)는 정보주체의 자유와 권리 보호를 위해 「개인정보 보호법」 및 관계 법령이 정한 바를 준수하여, 적법하게 개인정보를 처리하고 안전하게 관리하고 있습니다. 이에 「개인정보 보호법」 제30조에 따라 정보주체에게 개인정보 처리에 관한 절차 및 기준을 안내하고, 이와 관련한 고충을 신속하고 원활하게 처리할 수 있도록 하기 위하여 다음과 같이 개인정보 처리방침을 수립·공개합니다.
            </p>
          </section>

          {/* 제1조 */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-slate-900 mb-4 border-l-4 border-black pl-4">
              제1조 (개인정보의 처리 목적)
            </h2>
            <div className="space-y-3 text-base text-slate-600 leading-relaxed">
              <p>회사는 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는 「개인정보 보호법」 제18조에 따라 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.</p>
              <div className="mt-4">
                <h3 className="text-lg font-bold text-slate-900 mb-2">1. 회원가입 및 관리</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>회원 가입의사 확인, 본인 식별·인증</li>
                  <li>회원자격 유지·관리</li>
                  <li>서비스 부정이용 방지</li>
                </ul>
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-bold text-slate-900 mb-2">2. 서비스 제공</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>프로젝트 등록 및 평가 서비스 제공</li>
                  <li>전문가 평가 및 협업 매칭 서비스</li>
                  <li>프로젝트 정보 관리 및 통계 제공</li>
                  <li>고객 상담 및 문의 응대</li>
                </ul>
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-bold text-slate-900 mb-2">3. 민원 처리</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>민원인의 신원 확인, 민원사항 확인</li>
                  <li>사실조사를 위한 연락·통지, 처리결과 통보</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 제2조 */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-slate-900 mb-4 border-l-4 border-black pl-4">
              제2조 (개인정보의 처리 및 보유기간)
            </h2>
            <div className="space-y-3 text-base text-slate-600 leading-relaxed">
              <p>① 회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에 동의받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.</p>
              <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <h3 className="text-base font-bold text-slate-900 mb-3">개인정보 처리 및 보유기간</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="font-semibold text-slate-800">• 회원 정보 (이메일, 이름)</p>
                    <p className="ml-4 text-slate-500">보유기간: 회원 탈퇴 시까지</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">• 프로젝트 정보, 평가 데이터</p>
                    <p className="ml-4 text-slate-500">보유기간: 서비스 이용 기간 중 (삭제 요청 시 즉시 파기)</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">• 서비스 이용 기록</p>
                    <p className="ml-4 text-slate-500">보유기간: 3개월 (통신비밀보호법 준수)</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 제3조 */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-slate-900 mb-4 border-l-4 border-black pl-4">
              제3조 (처리하는 개인정보의 항목)
            </h2>
            <div className="space-y-3 text-base text-slate-600 leading-relaxed">
              <p>회사는 다음의 개인정보 항목을 처리하고 있습니다.</p>
              <div className="mt-4 space-y-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <h3 className="text-base font-bold text-slate-900 mb-2">1. 회원가입 시</h3>
                  <p className="text-sm text-slate-500">• 필수항목: 이메일, 이름</p>
                  <p className="text-sm text-slate-500">• 선택항목: 프로필 이미지, 관심분야</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <h3 className="text-base font-bold text-slate-900 mb-2">2. 서비스 이용 시</h3>
                  <p className="text-sm text-slate-500">• 프로젝트 정보 (제목, 설명, 이미지)</p>
                  <p className="text-sm text-slate-500">• 평가 데이터 (점수, 코멘트)</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <h3 className="text-base font-bold text-slate-900 mb-2">3. 자동 수집 항목</h3>
                  <p className="text-sm text-slate-500">• IP 주소, 쿠키, 서비스 이용 기록, 방문 일시</p>
                </div>
              </div>
            </div>
          </section>

          {/* 제4조 */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-slate-900 mb-4 border-l-4 border-black pl-4">
              제4조 (개인정보의 제3자 제공)
            </h2>
            <div className="space-y-3 text-base text-slate-600 leading-relaxed">
              <p>① 회사는 정보주체의 개인정보를 제1조(개인정보의 처리 목적)에서 명시한 범위 내에서만 처리하며, 정보주체의 동의, 법률의 특별한 규정 등 「개인정보 보호법」 제17조 및 제18조에 해당하는 경우에만 개인정보를 제3자에게 제공합니다.</p>
              <p>② 회사는 현재 개인정보를 제3자에게 제공하고 있지 않습니다.</p>
            </div>
          </section>

          {/* 제5조 */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-slate-900 mb-4 border-l-4 border-black pl-4">
              제5조 (개인정보처리의 위탁)
            </h2>
            <div className="space-y-3 text-base text-slate-600 leading-relaxed">
              <p>① 회사는 원활한 개인정보 업무처리를 위하여 다음과 같이 개인정보 처리업무를 위탁하고 있습니다.</p>
              <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-sm text-slate-500">현재 개인정보 처리 위탁 업체 없음</p>
              </div>
              <p className="mt-4">② 회사는 위탁계약 체결 시 「개인정보 보호법」 제26조에 따라 위탁업무 수행목적 외 개인정보 처리금지, 기술적·관리적 보호조치, 재위탁 제한, 수탁자에 대한 관리·감독, 손해배상 등 책임에 관한 사항을 계약서 등 문서에 명시하고, 수탁자가 개인정보를 안전하게 처리하는지를 감독하고 있습니다.</p>
            </div>
          </section>

          {/* 제6조 */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-slate-900 mb-4 border-l-4 border-black pl-4">
              제6조 (정보주체의 권리·의무 및 행사방법)
            </h2>
            <div className="space-y-3 text-base text-slate-600 leading-relaxed">
              <p>① 정보주체는 회사에 대해 언제든지 다음 각 호의 개인정보 보호 관련 권리를 행사할 수 있습니다.</p>
              <ul className="list-decimal list-inside space-y-2 ml-4">
                <li>개인정보 열람 요구</li>
                <li>오류 등이 있을 경우 정정 요구</li>
                <li>삭제 요구</li>
                <li>처리정지 요구</li>
              </ul>
              <p>② 제1항에 따른 권리 행사는 회사에 대해 서면, 전화, 전자우편 등을 통하여 하실 수 있으며 회사는 이에 대해 지체없이 조치하겠습니다.</p>
            </div>
          </section>

          {/* 제7조 */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-slate-900 mb-4 border-l-4 border-black pl-4">
              제7조 (개인정보의 파기)
            </h2>
            <div className="space-y-3 text-base text-slate-600 leading-relaxed">
              <p>① 회사는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체없이 해당 개인정보를 파기합니다.</p>
              <div className="mt-4">
                <h3 className="text-lg font-bold text-slate-900 mb-2">파기 방법</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>전자적 파일 형태: 복구 및 재생되지 않도록 안전하게 삭제</li>
                  <li>종이에 출력된 개인정보: 분쇄기로 분쇄하거나 소각</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 제8조 */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-slate-900 mb-4 border-l-4 border-black pl-4">
              제8조 (개인정보의 안전성 확보조치)
            </h2>
            <div className="space-y-3 text-base text-slate-600 leading-relaxed">
              <p>회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다.</p>
              <ul className="list-decimal list-inside space-y-2 ml-4">
                <li>관리적 조치: 내부관리계획 수립·시행, 정기적 직원 교육 등</li>
                <li>기술적 조치: 개인정보처리시스템 등의 접근권한 관리, 접근통제시스템 설치, 고유식별정보 등의 암호화, 보안프로그램 설치</li>
                <li>물리적 조치: 전산실, 자료보관실 등의 접근통제</li>
              </ul>
            </div>
          </section>

          {/* 제9조 */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-slate-900 mb-4 border-l-4 border-black pl-4">
              제9조 (개인정보 보호책임자)
            </h2>
            <div className="space-y-3 text-base text-slate-600 leading-relaxed">
              <p>① 회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.</p>
              <div className="mt-4 p-6 bg-slate-50 rounded-xl border border-slate-100">
                <h3 className="text-lg font-bold text-slate-900 mb-4">개인정보 보호책임자</h3>
                <div className="space-y-2 text-sm text-slate-600">
                  <p>• 성명: 이준호</p>
                  <p>• 직책: 개인정보관리책임자</p>
                  <p>• 연락처: 010-9249-3872</p>
                  <p>• 이메일: support@myratingis.kr</p>
                </div>
              </div>
              <p className="mt-4">② 정보주체는 회사의 서비스를 이용하시면서 발생한 모든 개인정보 보호 관련 문의, 불만처리, 피해구제 등에 관한 사항을 개인정보 보호책임자에게 문의하실 수 있습니다.</p>
            </div>
          </section>

          {/* 제10조 */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-slate-900 mb-4 border-l-4 border-black pl-4">
              제10조 (개인정보 열람청구)
            </h2>
            <div className="space-y-3 text-base text-slate-600 leading-relaxed">
              <p>정보주체는 「개인정보 보호법」 제35조에 따른 개인정보의 열람 청구를 아래의 부서에 할 수 있습니다.</p>
              <div className="mt-4 p-6 bg-slate-50 rounded-xl border border-slate-100">
                <h3 className="text-lg font-bold text-slate-900 mb-4">개인정보 열람청구 접수·처리 부서</h3>
                <div className="space-y-2 text-sm text-slate-600">
                  <p>• 부서명: 고객지원팀</p>
                  <p>• 연락처: 010-9249-3872</p>
                  <p>• 이메일: support@myratingis.kr</p>
                </div>
              </div>
            </div>
          </section>

          {/* 제11조 */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-slate-900 mb-4 border-l-4 border-black pl-4">
              제11조 (권익침해 구제방법)
            </h2>
            <div className="space-y-3 text-base text-slate-600 leading-relaxed">
              <p>정보주체는 개인정보침해로 인한 구제를 받기 위하여 개인정보분쟁조정위원회, 한국인터넷진흥원 개인정보침해신고센터 등에 분쟁해결이나 상담 등을 신청할 수 있습니다.</p>
              <div className="mt-4 space-y-3">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="font-semibold text-slate-900">개인정보분쟁조정위원회</p>
                  <p className="text-sm text-slate-500">전화: 1833-6972 | 홈페이지: www.kopico.go.kr</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="font-semibold text-slate-900">개인정보침해신고센터</p>
                  <p className="text-sm text-slate-500">전화: (국번없이) 118 | 홈페이지: privacy.kisa.or.kr</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="font-semibold text-slate-900">대검찰청 사이버범죄수사단</p>
                  <p className="text-sm text-slate-500">전화: 1301 | 홈페이지: www.spo.go.kr</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="font-semibold text-slate-900">경찰청 사이버안전국</p>
                  <p className="text-sm text-slate-500">전화: (국번없이) 182 | 홈페이지: cyberbureau.police.go.kr</p>
                </div>
              </div>
            </div>
          </section>

          {/* 제12조 */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-slate-900 mb-4 border-l-4 border-black pl-4">
              제12조 (개인정보 처리방침 변경)
            </h2>
            <div className="space-y-3 text-base text-slate-600 leading-relaxed">
              <p>① 이 개인정보 처리방침은 2026. 3. 28.부터 적용됩니다.</p>
              <p>② 이전의 개인정보 처리방침은 아래에서 확인하실 수 있습니다.</p>
            </div>
          </section>

          {/* 문의 안내 */}
          <div className="mt-12 p-6 bg-black text-white rounded-2xl">
            <h3 className="text-lg font-bold mb-3">
              개인정보 처리방침 관련 문의
            </h3>
            <div className="text-sm text-gray-300 space-y-1">
              <p>이메일: support@myratingis.kr</p>
              <p>개인정보 보호책임자: 이준호</p>
              <p>연락처: 010-9249-3872</p>
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
