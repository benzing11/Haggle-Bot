import { HaggleApp } from "@/components/haggle/haggle-app";
import { IntroShell } from "@/components/haggle/intro-shell";

export default function Home() {
  return (
    <IntroShell>
      <HaggleApp />
    </IntroShell>
  );
}
