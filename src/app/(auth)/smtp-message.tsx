import { ArrowUpRight, InfoIcon } from "lucide-react";
import Link from "next/link";

export function SmtpMessage() {
  return (
    <div className="bg-muted/50 px-5 py-3 border mt-[2rem] rounded-md flex gap-4">
      <InfoIcon size={16} className="mt-0.5" />
      <div className="flex flex-col gap-1">
        <small className="text-sm text-secondary-foreground">
          <strong>Note:</strong> Sign-up confirmation and password reset emails are
          sent via SMTP. Configure SMTP_HOST, SMTP_USER, and SMTP_PASS in .env
          before inviting users or enabling self-service registration.
        </small>
        <div>
          <Link
            href="https://nodemailer.com/usage/"
            target="_blank"
            className="text-primary/50 hover:text-primary flex items-center text-sm gap-1"
          >
            Nodemailer setup docs <ArrowUpRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
