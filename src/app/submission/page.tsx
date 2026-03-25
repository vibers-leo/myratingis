
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function SubmissionPage() {
    return (
        <div className="container mx-auto px-4 py-8 max-w-2xl">
            <h1 className="text-2xl font-bold mb-6">프로젝트 등록</h1>
            <form className="space-y-6">
                <div>
                    <label className="block text-sm font-medium mb-2">프로젝트 제목</label>
                    <Input placeholder="프로젝트 제목을 입력하세요" />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-2">설명</label>
                    <Textarea placeholder="프로젝트에 대한 설명을 입력하세요" className="min-h-[150px]" />
                </div>

                <div>
                    <Button type="submit" className="w-full">등록하기</Button>
                </div>
            </form>
        </div>
    );
}
