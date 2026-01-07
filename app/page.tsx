import { VoiceInterface } from "@/components/voice/VoiceInterface";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { IconLayoutDashboard } from "@tabler/icons-react";

export default function Page() {
  return (
    <>
      <div className="fixed top-4 right-4 z-50 animate-in fade-in slide-in-from-top-4 duration-700">
        <Link href="/admin">
          <Button variant="outline">
            <IconLayoutDashboard className="h-4 w-4 transition-transform group-hover:rotate-12" />
            <span className="font-medium">ড্যাশবোর্ড</span>
          </Button>
        </Link>
      </div>
      <VoiceInterface />
    </>
  );
}
